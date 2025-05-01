"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const block_basekit_server_api_1 = require("@lark-opdev/block-basekit-server-api");
const { t } = block_basekit_server_api_1.field;
// --- Domain Whitelist (Keep commented lines for debugging) ---
// basekit.addDomainList(['www.xiaoshanqing.tech']);
// basekit.addDomainList(['121.4.126.31']);
// basekit.addDomainList(['127.0.0.1']); // Currently active for local testing
block_basekit_server_api_1.basekit.addDomainList(['42.192.40.44', '127.0.0.1']); // Currently active for local testing
// --- Helper Functions ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function logInfo(message, data = {}) {
    // Simple console log for debugging within Basekit environment
    console.log(JSON.stringify({ message, ...data }, null, 2));
}
// --- Basekit Field Definition ---
block_basekit_server_api_1.basekit.addField({
    options: {
        disableAutoUpdate: true, // Manual trigger only
    },
    formItems: [
        {
            key: 'url',
            label: '视频地址',
            component: block_basekit_server_api_1.FieldComponent.FieldSelect,
            props: {
                supportType: [block_basekit_server_api_1.FieldType.Text], // Expect Text or URL field types
            },
            validator: {
                required: true,
            }
        },
    ],
    resultType: {
        type: block_basekit_server_api_1.FieldType.Object,
        extra: {
            icon: {
                light: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/eqgeh7upeubqnulog/chatbot.svg',
                dark: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/eqgeh7upeubqnulog/chatbot.svg', // Provide dark icon if available
            },
            properties: [
                // Keep result properties as defined before, ensure they match the final data structure
                { key: 'id', isGroupByKey: true, type: block_basekit_server_api_1.FieldType.Text, title: 'ID', hidden: true },
                { key: 'title', type: block_basekit_server_api_1.FieldType.Text, title: '标题', primary: true },
                { key: 'authorName', type: block_basekit_server_api_1.FieldType.Text, title: '作者' },
                { key: 'description', type: block_basekit_server_api_1.FieldType.Text, title: '描述' },
                { key: 'publishTime', type: block_basekit_server_api_1.FieldType.DateTime, title: '发布时间' },
                { key: 'likeCount', type: block_basekit_server_api_1.FieldType.Number, title: '点赞数' },
                { key: 'collectCount', type: block_basekit_server_api_1.FieldType.Number, title: '收藏数' },
                { key: 'shareCount', type: block_basekit_server_api_1.FieldType.Number, title: '转发数' },
                { key: 'commentCount', type: block_basekit_server_api_1.FieldType.Number, title: '评论数' },
                { key: 'tags', type: block_basekit_server_api_1.FieldType.Text, title: '标签' },
                { key: 'coverUrl', type: block_basekit_server_api_1.FieldType.Text, title: '封面地址' },
                { key: 'videoUrl', type: block_basekit_server_api_1.FieldType.Text, title: '视频下载地址' },
                { key: 'content', type: block_basekit_server_api_1.FieldType.Text, title: '文案' }, // Included extracted text/content
            ],
        },
    },
    authorizations: [
        {
            id: 'api-key',
            platform: 'baidu', // Or other identifier
            type: block_basekit_server_api_1.AuthorizationType.HeaderBearerToken,
            required: true,
            instructionsUrl: "https://www.feishu.com", // Replace with actual help link
            label: '请填写 API Key',
            icon: { light: '', dark: '' }
        }
    ],
    execute: async (formItemParams, context) => {
        logInfo('程序开始记录日志，参数-', { formItemParams });
        // --- 1. Get Input URL and Options ---
        const urlField = formItemParams.url;
        // const extractText = false;  // 默认提取文案
        const extractText = true; // 默认提取文案
        const includeComments = false; // Still hardcoded, adjust if needed
        logInfo('参数记录-', { extractText, includeComments });
        if (!urlField || !urlField.length) {
            return { code: block_basekit_server_api_1.FieldCode.ConfigError, msg: '请先选择包含媒体链接的字段' };
        }
        // Extract URL Text (using the robust logic from previous version)
        let urlText = '';
        try {
            const firstItem = urlField[0];
            if (firstItem.type === 'text') {
                urlText = firstItem.text;
            }
            else if (firstItem.type === 'url') {
                urlText = firstItem.link;
            }
            else if (Array.isArray(firstItem.value)) {
                const cellValue = firstItem.value[0];
                if (cellValue?.type === 'text') { // Add null check for cellValue
                    urlText = cellValue.text;
                }
                else if (cellValue?.type === 'url') {
                    urlText = cellValue.link;
                }
            }
            if (!urlText && typeof firstItem.value === 'string') {
                urlText = firstItem.value;
            }
        }
        catch (error) {
            logInfo('提取参数失败---Error extracting URL from field', { error: error.message, urlField });
            return { code: block_basekit_server_api_1.FieldCode.ConfigError, msg: `无法从字段中提取有效的URL: ${error.message}` };
        }
        if (!urlText || !urlText.trim()) {
            logInfo('参数记录失败---No URL found');
            return { code: block_basekit_server_api_1.FieldCode.ConfigError, msg: '未能从所选字段中提取有效的 URL 文本' };
        }
        logInfo('记录url---', { urlText });
        // --- 2. Prepare API Request Details ---
        // Use the currently active domain from the whitelist
        const activeDomain = 'http://127.0.0.1:8083'; // Fallback just in case
        // const activeDomain = 'http://42.192.40.44:8083'
        const host_base = activeDomain.startsWith('http') ? activeDomain : `http://${activeDomain}`; // Ensure protocol
        const extract_api_path = '/api/media/extract';
        const status_api_path_base = '/api/media/extract/status/'; // Base path for status
        logInfo('记录---API base', { host_base });
        // Context Info and Headers (keep as before)
        const contextInfo = {
            baseSignature: context.baseSignature,
            baseID: context.baseID,
            logID: context.logID,
            tableID: context.tableID,
            packID: context.packID,
            tenantKey: context.tenantKey,
            timeZone: context.timeZone,
            baseOwnerID: context.baseOwnerID
        };
        const headers = {
            'Content-Type': 'application/json',
            'x-source': 'feishu-sheet',
            'x-app-id': contextInfo.packID || 'get-info-by-url',
            'x-user-uuid': contextInfo.tenantKey || 'user-123456',
            // 可选的用户昵称
            // 'x-user-nickname': '用户昵称',
            // 添加所有上下文信息到请求头
            'x-base-signature': contextInfo.baseSignature || '',
            'x-base-id': contextInfo.baseID || '',
            'x-log-id': contextInfo.logID || '',
            'x-table-id': contextInfo.tableID || '',
            // 'x-pack-id': contextInfo.packID || '',
            // 'x-tenant-key': contextInfo.tenantKey || '',
            'x-time-zone': contextInfo.timeZone || '',
            'x-base-owner-id': contextInfo.baseOwnerID || ''
        };
        // x_trace_key
        let mediaData = null; // To store the final result data
        try {
            // --- 3. Call Initial Extract API (POST) ---
            logInfo('记录POST', { extractText });
            const response = await context.fetch(`${host_base}${extract_api_path}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    url: urlText,
                    extract_text: extractText, // Pass the flag to the API
                    include_comments: includeComments,
                    context: contextInfo // Optional
                }),
            }, 'api-key');
            if (!response.ok) {
                const errorText = await response.text();
                logInfo('记录POST失败 API call failed (non-OK status)', { status: response.status, text: errorText });
                if (response.status === 402) {
                    logInfo('记录POST请求返回值失败信息---API returned non-success code', { response });
                    return { code: block_basekit_server_api_1.FieldCode.QuotaExhausted, msg: `API 返回非成功代码: ${response.code},错误信息是 ${response.text}` };
                }
                return { code: block_basekit_server_api_1.FieldCode.Error, msg: `API 请求失败: ${response.status} ${errorText}` };
            }
            const res = await response.json();
            logInfo('记录POST请求返回值', { res });
            if (res.code == 402) {
                logInfo('记录POST请求返回值失败信息---API returned non-success code', { res });
                return { code: block_basekit_server_api_1.FieldCode.QuotaExhausted, msg: `API 返回非成功代码: ${res.code},错误信息是 ${res.message}` };
            }
            // --- 4. Handle Response: Poll or Use Direct Data ---
            if (extractText) {
                // --- 4a. Scenario: Polling Required ---
                logInfo('需要获取文案信息---Polling scenario: extractText is true');
                if (res.code === 202 && res.task_id) {
                    const taskId = res.task_id;
                    const root_trace_key = res.root_trace_key; //
                    logInfo('拿到了服务端返回的任务号 ---Received task ID, starting polling', { taskId });
                    // Polling Logic (copied from previous version)
                    // const maxAttempts = 60;//
                    // const pollInterval = 10000; // 10 seconds
                    const maxAttempts = 30;
                    const pollInterval = 20 * 1000; // 10 seconds
                    let attempts = 0;
                    let taskComplete = false;
                    let finalDataFromPolling = null; // Use a separate variable inside the polling scope
                    headers['x-root-trace-key'] = root_trace_key;
                    while (attempts < maxAttempts && !taskComplete) {
                        attempts++;
                        logInfo(`taskid -- ${taskId} 开始轮询任务执行状态----Polling status API, attempt ${attempts}/${maxAttempts}`);
                        if (attempts > 1)
                            await sleep(pollInterval);
                        let isBreak = false;
                        try {
                            const statusResponse = await context.fetch(`${host_base}${status_api_path_base}${taskId}`, {
                                method: 'GET',
                                headers: headers, // Reuse headers or create specific ones if needed
                            }, 'api-key');
                            if (!statusResponse.ok) {
                                const errorText = await statusResponse.text();
                                logInfo(`taskid -- ${taskId} 记录任务的状态----Status API call failed (attempt ${attempts}, non-OK status)`, { status: statusResponse.status, text: errorText });
                                if (attempts === maxAttempts)
                                    throw new Error(`状态查询失败 (尝试 ${attempts} 次): ${statusResponse.status} ${errorText}`);
                                continue; // Try polling again
                            }
                            const statusRes = await statusResponse.json();
                            logInfo(`taskid -- ${taskId} 记录任务的状态 ---Status API response (attempt ${attempts})`, { statusRes });
                            // Adjust condition based on your API's success response structure
                            if (statusRes.code === 200 && statusRes.data && statusRes.status === 'completed') {
                                finalDataFromPolling = statusRes.data;
                                taskComplete = true;
                                // logInfo( ' taskid -- ${taskId} 循环获取任务成功了 ( attempt ${attempts})----Task completed successfully via polling!',{statusRes});
                                logInfo(`taskid -- ${taskId} 循环获取任务成功了  ---Task completed successfully via polling!`, { statusRes });
                            }
                            else if (statusRes.code == 500 && statusRes.status === 'failed') {
                                logInfo(` taskid -- ${taskId} 任务返回失败----Task failed at attempt ${attempts}`, { statusRes });
                                isBreak = true;
                                throw new Error(`任务返回失败: ${statusRes.message}`);
                            }
                            else if ((statusRes.status === 'running' || statusRes.code !== 200) && attempts < maxAttempts) {
                                logInfo(`taskid -- ${taskId} 循环获取任务需要继续----Task still processing (attempt ${attempts})`);
                            }
                            else { // Task failed or timed out within API, or unexpected response
                                logInfo(`taskid -- ${taskId} 循环获取任务失败----Task failed or polling timed out (attempt ${attempts})`, { statusRes });
                                throw new Error(`获取结果失败: ${statusRes.message || '任务处理超时或失败'}`);
                            }
                        }
                        catch (pollError) {
                            logInfo(`taskid -- ${taskId} 循环获取任务异常----Error during status poll (attempt ${attempts})`, { error: pollError.message });
                            if (attempts === maxAttempts)
                                throw pollError; // Rethrow if max attempts reached
                            if (isBreak)
                                throw pollError;
                            // Optionally add delay before retrying after an error
                            await sleep(1000);
                        }
                    } // End while loop
                    if (!taskComplete || !finalDataFromPolling) {
                        throw new Error('无法在规定时间内获取到媒体信息 (Polling timed out or failed)');
                    }
                    mediaData = finalDataFromPolling; // Assign successful polling result
                }
                else { // Initial request failed or didn't return task_id when expected
                    logInfo(' 没有拿到服务端返回的任务号---Error: Polling required but task_id not received or initial error', { res });
                    throw new Error(`API 错误 (需要轮询但未获取 task_id): ${res.message || '无效的初始响应'}`);
                }
            }
            else {
                // --- 4b. Scenario: Direct Data Expected ---
                logInfo('只获取基本信息----Direct data scenario: extractText is false');
                if (res.code === 200 && res.data) {
                    logInfo('成功拿到基本信息----Received direct data successfully', { data: res.data });
                    mediaData = res.data; // Assign direct data
                }
                else { // Direct request failed or didn't return data when expected
                    logInfo('拿基本信息失败---Error: Expected direct data but not received or API error', { res });
                    throw new Error(`API 错误 (预期直接数据): ${res.message || '无效响应或缺少数据'}`);
                }
            }
            // --- 5. Process Final Data (Common Logic) ---
            if (!mediaData) {
                // This case should ideally be prevented by the logic above throwing errors
                logInfo('循环结束没有信息 ---Critical Error: mediaData is null after processing branches');
                throw new Error('未能通过任何方式检索到媒体数据。');
            }
            logInfo('拿到的最终信息---Processing final mediaData', { mediaData });
            let tagsStr = '';
            if (mediaData.tags && Array.isArray(mediaData.tags)) {
                tagsStr = mediaData.tags.join(', ');
            }
            // Map final mediaData to the resultType structure
            const result = {
                id: mediaData.video_id || mediaData.id || `${Date.now()}`, // Use appropriate ID field from API response
                title: mediaData.title || '无标题',
                authorName: mediaData.author?.nickname || mediaData.author_name || '未知作者', // Check API response fields
                description: mediaData.description || '',
                publishTime: mediaData.publish_time ? new Date(mediaData.publish_time).toISOString() : null, // Handle potential time formats
                likeCount: mediaData.statistics?.like_count ?? mediaData.like_count ?? 0, // Check alternative field names
                collectCount: mediaData.statistics?.collect_count ?? mediaData.collect_count ?? 0,
                shareCount: mediaData.statistics?.share_count ?? mediaData.share_count ?? 0,
                commentCount: mediaData.statistics?.comment_count ?? mediaData.comment_count ?? 0,
                tags: tagsStr,
                coverUrl: mediaData.media?.cover_url ?? mediaData.cover_url ?? '',
                videoUrl: mediaData.media?.video_url ?? mediaData.video_url ?? '',
                content: mediaData.content || '', //文案字段
            };
            logInfo('准备最终返回值---Final result prepared', { result });
            return {
                code: block_basekit_server_api_1.FieldCode.Success,
                data: result,
            };
        }
        catch (e) {
            // Catch errors from fetch, json parsing, polling logic, or thrown errors
            logInfo('执行失败了---Execution failed with error', { error: e.message, stack: e.stack });
            return {
                code: block_basekit_server_api_1.FieldCode.Error,
                msg: `执行捷径时出错: ${e.message}` // Return the error message
            };
        }
    },
});
exports.default = block_basekit_server_api_1.basekit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtRkFBK0g7QUFDL0gsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLGdDQUFLLENBQUM7QUFFcEIsZ0VBQWdFO0FBQ2hFLG9EQUFvRDtBQUNwRCwyQ0FBMkM7QUFDM0MsOEVBQThFO0FBQzlFLGtDQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsY0FBYyxFQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxxQ0FBcUM7QUFFMUYsMkJBQTJCO0FBQzNCLE1BQU0sS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN0RSxTQUFTLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxHQUFHLEVBQUU7SUFDakMsOERBQThEO0lBQzlELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCxtQ0FBbUM7QUFDbkMsa0NBQU8sQ0FBQyxRQUFRLENBQUM7SUFDZixPQUFPLEVBQUU7UUFDUCxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsc0JBQXNCO0tBQ2hEO0lBQ0QsU0FBUyxFQUFFO1FBQ1Q7WUFDRSxHQUFHLEVBQUUsS0FBSztZQUNWLEtBQUssRUFBRSxNQUFNO1lBQ2IsU0FBUyxFQUFFLHlDQUFjLENBQUMsV0FBVztZQUNyQyxLQUFLLEVBQUU7Z0JBQ0wsV0FBVyxFQUFFLENBQUMsb0NBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxpQ0FBaUM7YUFDakU7WUFDRCxTQUFTLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLElBQUk7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
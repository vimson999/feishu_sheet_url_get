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
                { key: 'content', type: block_basekit_server_api_1.FieldType.Text, title: '文案原文' }, // Included extracted text/content
                { key: 'core', type: block_basekit_server_api_1.FieldType.Text, title: '爆款视角 · 核心洞察' },
                { key: 'formula', type: block_basekit_server_api_1.FieldType.Text, title: '解构爆款 · 增长范式' },
                { key: 'golden3s', type: block_basekit_server_api_1.FieldType.Text, title: '黄金3秒 · 夺目开局策划' },
                { key: 'copywriting', type: block_basekit_server_api_1.FieldType.Text, title: '小红书流量文案' },
                { key: 'duration', type: block_basekit_server_api_1.FieldType.Number, title: '视频时长' },
                { key: 'total_required', type: block_basekit_server_api_1.FieldType.Number, title: '消耗积分' },
                // { key: 'user_available_points', type: FieldType.Number, title: '剩余积分' },
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
                core: mediaData.ai_assistant_text.core || '',
                formula: mediaData.ai_assistant_text.formula || '',
                golden3s: mediaData.ai_assistant_text.golden3s || '',
                copywriting: mediaData.ai_assistant_text.copywriting || '',
                duration: mediaData.media.duration || 0,
                total_required: mediaData.points.total_required || 0,
                // user_available_points: mediaData.points.user_available_points || 0, 
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
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
        logInfo('Starting execution', { formItemParams });
        // --- 1. Get Input URL and Options ---
        const urlField = formItemParams.url;
        // const extractText = false;  // 默认提取文案
        const extractText = true; // 默认提取文案
        const includeComments = false; // Still hardcoded, adjust if needed
        logInfo('Execution options', { extractText, includeComments });
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
            logInfo('Error extracting URL from field', { error: error.message, urlField });
            return { code: block_basekit_server_api_1.FieldCode.ConfigError, msg: `无法从字段中提取有效的URL: ${error.message}` };
        }
        if (!urlText || !urlText.trim()) {
            logInfo('Extracted URL is empty');
            return { code: block_basekit_server_api_1.FieldCode.ConfigError, msg: '未能从所选字段中提取有效的 URL 文本' };
        }
        logInfo('Extracted URL', { urlText });
        // --- 2. Prepare API Request Details ---
        // Use the currently active domain from the whitelist
        // const activeDomain = 'http://127.0.0.1:8083'; // Fallback just in case
        const activeDomain = 'http://42.192.40.44:8083';
        const host_base = activeDomain.startsWith('http') ? activeDomain : `http://${activeDomain}`; // Ensure protocol
        const extract_api_path = '/api/media/extract';
        const status_api_path_base = '/api/media/extract/status/'; // Base path for status
        logInfo('API base', { host_base });
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
            logInfo('Calling initial extract API (POST)', { extractText });
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
                logInfo('Initial API call failed (non-OK status)', { status: response.status, text: errorText });
                return { code: block_basekit_server_api_1.FieldCode.Error, msg: `API 请求失败: ${response.status} ${errorText}` };
            }
            const res = await response.json();
            logInfo('Initial API response received', { res });
            // --- 4. Handle Response: Poll or Use Direct Data ---
            if (extractText) {
                // --- 4a. Scenario: Polling Required ---
                logInfo('Polling scenario: extractText is true');
                if (res.code === 202 && res.task_id) {
                    const taskId = res.task_id;
                    const root_trace_key = res.root_trace_key; //
                    logInfo('Received task ID, starting polling', { taskId });
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
                        logInfo(`Polling status API, attempt ${attempts}/${maxAttempts}`);
                        if (attempts > 1)
                            await sleep(pollInterval);
                        try {
                            const statusResponse = await context.fetch(`${host_base}${status_api_path_base}${taskId}`, {
                                method: 'GET',
                                headers: headers, // Reuse headers or create specific ones if needed
                            }, 'api-key');
                            if (!statusResponse.ok) {
                                const errorText = await statusResponse.text();
                                logInfo(`Status API call failed (attempt ${attempts}, non-OK status)`, { status: statusResponse.status, text: errorText });
                                if (attempts === maxAttempts)
                                    throw new Error(`状态查询失败 (尝试 ${attempts} 次): ${statusResponse.status} ${errorText}`);
                                continue; // Try polling again
                            }
                            const statusRes = await statusResponse.json();
                            logInfo(`Status API response (attempt ${attempts})`, { statusRes });
                            // Adjust condition based on your API's success response structure
                            if (statusRes.code === 200 && statusRes.data && statusRes.status === 'completed') {
                                finalDataFromPolling = statusRes.data;
                                taskComplete = true;
                                logInfo('Task completed successfully via polling!');
                            }
                            else if ((statusRes.status === 'running' || statusRes.code !== 200) && attempts < maxAttempts) {
                                logInfo(`Task still processing (attempt ${attempts})`);
                            }
                            else { // Task failed or timed out within API, or unexpected response
                                logInfo(`Task failed or polling timed out (attempt ${attempts})`, { statusRes });
                                throw new Error(`获取结果失败: ${statusRes.message || '任务处理超时或失败'}`);
                            }
                        }
                        catch (pollError) {
                            logInfo(`Error during status poll (attempt ${attempts})`, { error: pollError.message });
                            if (attempts === maxAttempts)
                                throw pollError; // Rethrow if max attempts reached
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
                    logInfo('Error: Polling required but task_id not received or initial error', { res });
                    throw new Error(`API 错误 (需要轮询但未获取 task_id): ${res.message || '无效的初始响应'}`);
                }
            }
            else {
                // --- 4b. Scenario: Direct Data Expected ---
                logInfo('Direct data scenario: extractText is false');
                if (res.code === 200 && res.data) {
                    logInfo('Received direct data successfully', { data: res.data });
                    mediaData = res.data; // Assign direct data
                }
                else { // Direct request failed or didn't return data when expected
                    logInfo('Error: Expected direct data but not received or API error', { res });
                    throw new Error(`API 错误 (预期直接数据): ${res.message || '无效响应或缺少数据'}`);
                }
            }
            // --- 5. Process Final Data (Common Logic) ---
            if (!mediaData) {
                // This case should ideally be prevented by the logic above throwing errors
                logInfo('Critical Error: mediaData is null after processing branches');
                throw new Error('未能通过任何方式检索到媒体数据。');
            }
            logInfo('Processing final mediaData', { mediaData });
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
            logInfo('Final result prepared', { result });
            return {
                code: block_basekit_server_api_1.FieldCode.Success,
                data: result,
            };
        }
        catch (e) {
            // Catch errors from fetch, json parsing, polling logic, or thrown errors
            logInfo('Execution failed with error', { error: e.message, stack: e.stack });
            return {
                code: block_basekit_server_api_1.FieldCode.Error,
                msg: `执行捷径时出错: ${e.message}` // Return the error message
            };
        }
    },
});
exports.default = block_basekit_server_api_1.basekit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtRkFBK0g7QUFDL0gsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLGdDQUFLLENBQUM7QUFFcEIsZ0VBQWdFO0FBQ2hFLG9EQUFvRDtBQUNwRCwyQ0FBMkM7QUFDM0MsOEVBQThFO0FBQzlFLGtDQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsY0FBYyxFQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxxQ0FBcUM7QUFFMUYsMkJBQTJCO0FBQzNCLE1BQU0sS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN0RSxTQUFTLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxHQUFHLEVBQUU7SUFDakMsOERBQThEO0lBQzlELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCxtQ0FBbUM7QUFDbkMsa0NBQU8sQ0FBQyxRQUFRLENBQUM7SUFDZixPQUFPLEVBQUU7UUFDUCxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsc0JBQXNCO0tBQ2hEO0lBQ0QsU0FBUyxFQUFFO1FBQ1Q7WUFDRSxHQUFHLEVBQUUsS0FBSztZQUNWLEtBQUssRUFBRSxNQUFNO1lBQ2IsU0FBUyxFQUFFLHlDQUFjLENBQUMsV0FBVztZQUNyQyxLQUFLLEVBQUU7Z0JBQ0wsV0FBVyxFQUFFLENBQUMsb0NBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxpQ0FBaUM7YUFDakU7WUFDRCxTQUFTLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLElBQUk7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
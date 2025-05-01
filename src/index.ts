import { basekit, FieldType, field, FieldComponent, FieldCode, AuthorizationType } from '@lark-opdev/block-basekit-server-api';
const { t } = field;

// --- Domain Whitelist (Keep commented lines for debugging) ---
// basekit.addDomainList(['www.xiaoshanqing.tech']);
// basekit.addDomainList(['121.4.126.31']);
// basekit.addDomainList(['127.0.0.1']); // Currently active for local testing
basekit.addDomainList(['42.192.40.44','127.0.0.1']); // Currently active for local testing

// --- Helper Functions ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function logInfo(message, data = {}) {
  // Simple console log for debugging within Basekit environment
  console.log(JSON.stringify({ message, ...data }, null, 2));
}

// --- Basekit Field Definition ---
basekit.addField({
  options: {
    disableAutoUpdate: true, // Manual trigger only
  },
  formItems: [
    {
      key: 'url',
      label: '视频地址',
      component: FieldComponent.FieldSelect,
      props: {
        supportType: [FieldType.Text], // Expect Text or URL field types
      },
      validator: {
        required: true,
      }
    },
  ],
  resultType: {
    type: FieldType.Object,
    extra: {
      icon: {
        light: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/eqgeh7upeubqnulog/chatbot.svg',
        dark: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/eqgeh7upeubqnulog/chatbot.svg', // Provide dark icon if available
      },
      properties: [
        // Keep result properties as defined before, ensure they match the final data structure
        { key: 'id', isGroupByKey: true, type: FieldType.Text, title: 'ID', hidden: true },
        { key: 'title', type: FieldType.Text, title: '标题', primary: true },
        { key: 'authorName', type: FieldType.Text, title: '作者' },
        { key: 'description', type: FieldType.Text, title: '描述' },
        { key: 'publishTime', type: FieldType.DateTime, title: '发布时间' },
        { key: 'likeCount', type: FieldType.Number, title: '点赞数' },
        { key: 'collectCount', type: FieldType.Number, title: '收藏数' },
        { key: 'shareCount', type: FieldType.Number, title: '转发数' },
        { key: 'commentCount', type: FieldType.Number, title: '评论数' },
        { key: 'tags', type: FieldType.Text, title: '标签' },
        { key: 'coverUrl', type: FieldType.Text, title: '封面地址' },
        { key: 'videoUrl', type: FieldType.Text, title: '视频下载地址' },
        { key: 'content', type: FieldType.Text, title: '文案' }, // Included extracted text/content
      ],
    },
  },
  authorizations: [ // Keep authorization as defined before
    {
      id: 'api-key',
      platform: 'baidu', // Or other identifier
      type: AuthorizationType.HeaderBearerToken,
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
    const extractText = true;  // 默认提取文案
    const includeComments = false; // Still hardcoded, adjust if needed

    logInfo('参数记录-', { extractText, includeComments });

    if (!urlField || !urlField.length) {
      return { code: FieldCode.ConfigError, msg: '请先选择包含媒体链接的字段' };
    }

    // Extract URL Text (using the robust logic from previous version)
    let urlText = '';
    try {
        const firstItem = urlField[0];
         if (firstItem.type === 'text') {
            urlText = firstItem.text;
        } else if (firstItem.type === 'url') {
            urlText = firstItem.link;
        } else if (Array.isArray(firstItem.value)) {
             const cellValue = firstItem.value[0];
             if (cellValue?.type === 'text') { // Add null check for cellValue
                 urlText = cellValue.text;
             } else if (cellValue?.type === 'url'){
                 urlText = cellValue.link;
             }
        }
        if (!urlText && typeof firstItem.value === 'string') {
             urlText = firstItem.value;
        }
    } catch (error) {
      logInfo('提取参数失败---Error extracting URL from field', { error: error.message, urlField });
      return { code: FieldCode.ConfigError, msg: `无法从字段中提取有效的URL: ${error.message}` };
    }


    if (!urlText || !urlText.trim()) {
      logInfo('参数记录失败---No URL found');
      return { code: FieldCode.ConfigError, msg: '未能从所选字段中提取有效的 URL 文本' };
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
      baseSignature: (context as any).baseSignature,
      baseID: (context as any).baseID,
      logID: (context as any).logID,
      tableID: (context as any).tableID,
      packID: (context as any).packID,
      tenantKey: (context as any).tenantKey,
      timeZone: (context as any).timeZone,
      baseOwnerID: (context as any).baseOwnerID
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
            return { code: FieldCode.QuotaExhausted, msg: `API 返回非成功代码: ${response.code},错误信息是 ${response.text}` };
          }

          return { code: FieldCode.Error, msg: `API 请求失败: ${response.status} ${errorText}` };
      }

      const res = await response.json();
      logInfo('记录POST请求返回值', { res });
      if (res.code == 402) {
          logInfo('记录POST请求返回值失败信息---API returned non-success code', { res });
          return { code: FieldCode.QuotaExhausted, msg: `API 返回非成功代码: ${res.code},错误信息是 ${res.message}` };
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
            if (attempts > 1) await sleep(pollInterval);

            let isBreak = false
            try {
              const statusResponse = await context.fetch(`${host_base}${status_api_path_base}${taskId}`, {
                method: 'GET',
                headers: headers, // Reuse headers or create specific ones if needed
              }, 'api-key');

              if (!statusResponse.ok) {
                  const errorText = await statusResponse.text();
                  logInfo(`taskid -- ${taskId} 记录任务的状态----Status API call failed (attempt ${attempts}, non-OK status)`, { status: statusResponse.status, text: errorText });
                  if (attempts === maxAttempts) throw new Error(`状态查询失败 (尝试 ${attempts} 次): ${statusResponse.status} ${errorText}`);
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

              } else if ( statusRes.code == 500 && statusRes.status === 'failed') {
                  logInfo(` taskid -- ${taskId} 任务返回失败----Task failed at attempt ${attempts}`, { statusRes });
                  isBreak = true
                  throw new Error(`任务返回失败: ${statusRes.message}`);

              } else if ( ( statusRes.status === 'running' || statusRes.code !== 200 ) && attempts < maxAttempts) {
                  logInfo(`taskid -- ${taskId} 循环获取任务需要继续----Task still processing (attempt ${attempts})`);

              } else { // Task failed or timed out within API, or unexpected response
                  logInfo(`taskid -- ${taskId} 循环获取任务失败----Task failed or polling timed out (attempt ${attempts})`, { statusRes });
                  throw new Error(`获取结果失败: ${statusRes.message || '任务处理超时或失败'}`);
              }
            } catch (pollError) {
                 logInfo(`taskid -- ${taskId} 循环获取任务异常----Error during status poll (attempt ${attempts})`, { error: pollError.message });
                 if (attempts === maxAttempts) throw pollError; // Rethrow if max attempts reached
                 if (isBreak) throw pollError;
                 // Optionally add delay before retrying after an error
                 await sleep(1000);
            }
          } // End while loop

          if (!taskComplete || !finalDataFromPolling) {
             throw new Error('无法在规定时间内获取到媒体信息 (Polling timed out or failed)');
          }
          mediaData = finalDataFromPolling; // Assign successful polling result

        } else { // Initial request failed or didn't return task_id when expected
            logInfo(' 没有拿到服务端返回的任务号---Error: Polling required but task_id not received or initial error', { res });
            throw new Error(`API 错误 (需要轮询但未获取 task_id): ${res.message || '无效的初始响应'}`);
        }
      } else {
        // --- 4b. Scenario: Direct Data Expected ---
        logInfo('只获取基本信息----Direct data scenario: extractText is false');
        if (res.code === 200 && res.data) {
          logInfo('成功拿到基本信息----Received direct data successfully', { data: res.data });
          mediaData = res.data; // Assign direct data
        } else { // Direct request failed or didn't return data when expected
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
        code: FieldCode.Success,
        data: result,
      };

    } catch (e) {
      // Catch errors from fetch, json parsing, polling logic, or thrown errors
      logInfo('执行失败了---Execution failed with error', { error: e.message, stack: e.stack });
      return {
        code: FieldCode.Error,
        msg: `执行捷径时出错: ${e.message}` // Return the error message
      };
    }
  },
});

export default basekit;
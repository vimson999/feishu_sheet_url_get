"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const block_basekit_server_api_1 = require("@lark-opdev/block-basekit-server-api");
const { t } = block_basekit_server_api_1.field;
// 通过addDomainList添加请求接口的域名
// basekit.addDomainList(['www.xiaoshanqing.tech']);
block_basekit_server_api_1.basekit.addDomainList(['121.4.126.31']);
block_basekit_server_api_1.basekit.addField({
    options: {
        disableAutoUpdate: true, // 关闭自动更新
    },
    formItems: [
        {
            key: 'url',
            label: '视频地址',
            component: block_basekit_server_api_1.FieldComponent.FieldSelect,
            props: {
                supportType: [block_basekit_server_api_1.FieldType.Text],
            },
            validator: {
                required: true,
            }
        },
    ],
    // 定义捷径的返回结果类型
    resultType: {
        type: block_basekit_server_api_1.FieldType.Object,
        extra: {
            icon: {
                light: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/eqgeh7upeubqnulog/chatbot.svg',
            },
            properties: [
                {
                    key: 'id',
                    isGroupByKey: true,
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: 'ID',
                    hidden: true,
                },
                {
                    key: 'title',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '标题',
                    primary: true,
                },
                {
                    key: 'authorName',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '作者',
                },
                {
                    key: 'description',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '正文',
                },
                // {
                //   key: 'publishTime',
                //   type: FieldType.DateTime,
                //   title: '发布时间',
                // },
                // {
                //   key: 'playCount',
                //   type: FieldType.Number,
                //   title: '播放数',
                // },
                {
                    key: 'likeCount',
                    type: block_basekit_server_api_1.FieldType.Number,
                    title: '点赞数',
                },
                {
                    key: 'collectCount',
                    type: block_basekit_server_api_1.FieldType.Number,
                    title: '收藏数',
                },
                {
                    key: 'shareCount',
                    type: block_basekit_server_api_1.FieldType.Number,
                    title: '转发数',
                },
                {
                    key: 'commentCount',
                    type: block_basekit_server_api_1.FieldType.Number,
                    title: '评论数',
                },
                {
                    key: 'tags',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '标签',
                },
                {
                    key: 'coverUrl',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '封面地址',
                },
                {
                    key: 'videoUrl',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '视频下载地址',
                },
                {
                    key: 'content',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '文案',
                }
            ],
        },
    },
    authorizations: [
        {
            id: 'api-key', // 授权的id，用于context.fetch第三个参数以区分该请求使用哪个授权
            platform: 'baidu', // 需要与之授权的平台,比如baidu(必须要是已经支持的三方凭证,不可随便填写,如果想要支持更多的凭证，请填写申请表单)
            type: block_basekit_server_api_1.AuthorizationType.HeaderBearerToken,
            required: true, // 设置为选填，用户如果填了授权信息，请求中则会携带授权信息，否则不带授权信息
            instructionsUrl: "https://www.feishu.com", // 帮助链接，告诉使用者如何填写这个apikey
            label: '请填写 api key',
            icon: {
                light: '',
                dark: ''
            }
        }
    ],
    execute: async (formItemParams, context) => {
        /** 为方便查看日志，使用此方法替代console.log */
        function debugLog(arg) {
            console.log(JSON.stringify({
                formItemParams,
                context,
                arg
            }));
        }
        // 获取字段值时需要正确处理字段结构
        const urlField = formItemParams.url;
        // 使用默认参数值，而不是从表单获取
        const extractText = true; // 默认提取文案
        const includeComments = false; // 默认不包含评论
        // 检查字段存在性
        if (!urlField || !urlField.length) {
            return {
                code: block_basekit_server_api_1.FieldCode.ConfigError,
                msg: '请先选择媒体链接字段',
            };
        }
        // 从文本字段中提取实际的URL文本
        let urlText = '';
        for (const item of urlField) {
            if (item.type === 'text') {
                urlText += item.text;
            }
            else if (item.type === 'url') {
                urlText += item.link;
            }
        }
        if (!urlText) {
            return {
                code: block_basekit_server_api_1.FieldCode.ConfigError,
                msg: '未能从所选字段中提取有效的URL',
            };
        }
        console.log('从字段中提取的URL:', urlText);
        try {
            // 切换到新的媒体提取API
            const host_url = 'http://121.4.126.31/api/media/extract';
            // const host_url = 'https://www.xiaoshanqing.tech/api/media/extract';
            // 获取完整的上下文信息
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
            console.log('飞书捷径完整上下文信息:', contextInfo);
            const response = await context.fetch(host_url, {
                method: 'POST',
                headers: {
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
                },
                body: JSON.stringify({
                    url: urlText,
                    extract_text: extractText,
                    include_comments: includeComments,
                    context: contextInfo // 可选：将完整上下文信息作为请求体的一部分
                }),
            }, 'api-key');
            const res = await response.json();
            console.log('API响应:', res);
            /** 为方便查看日志，使用此方法替代console.log */
            function debugLog(arg) {
                console.log(JSON.stringify({
                    res
                }));
            }
            // 检查响应是否成功，并从正确的路径提取数据
            if (res.code === 200 && res.data) {
                const mediaData = res.data;
                // 处理标签列表，转换为逗号分隔的字符串
                let tagsStr = '';
                if (mediaData.tags && Array.isArray(mediaData.tags)) {
                    tagsStr = mediaData.tags.join(', ');
                }
                return {
                    code: block_basekit_server_api_1.FieldCode.Success,
                    data: {
                        id: mediaData.video_id || `${Date.now()}`,
                        title: mediaData.title || '无标题',
                        authorName: mediaData.author?.nickname || '未知作者',
                        publishTime: mediaData.publish_time || new Date().toISOString(),
                        playCount: mediaData.statistics?.play_count || 0,
                        likeCount: mediaData.statistics?.like_count || 0,
                        collectCount: mediaData.statistics?.collect_count || 0,
                        shareCount: mediaData.statistics?.share_count || 0,
                        commentCount: mediaData.statistics?.comment_count || 0,
                        tags: tagsStr,
                        coverUrl: mediaData.media?.cover_url || '',
                        videoUrl: mediaData.media?.video_url || '',
                        content: mediaData.content || '无内容',
                        description: mediaData.description || '',
                    },
                };
            }
            else {
                return {
                    code: block_basekit_server_api_1.FieldCode.Error,
                    msg: `API响应错误: ${res.message || '未知错误'}`,
                };
            }
        }
        catch (e) {
            console.error('请求失败:', e);
            return {
                code: block_basekit_server_api_1.FieldCode.Error,
                msg: `请求失败: ${e.message}`
            };
        }
    },
});
exports.default = block_basekit_server_api_1.basekit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtRkFBOEg7QUFDOUgsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLGdDQUFLLENBQUM7QUFFcEIsMkJBQTJCO0FBQzNCLG9EQUFvRDtBQUNwRCxrQ0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFFeEMsa0NBQU8sQ0FBQyxRQUFRLENBQUM7SUFDZixPQUFPLEVBQUU7UUFDUCxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsU0FBUztLQUNuQztJQUNELFNBQVMsRUFBRTtRQUNUO1lBQ0UsR0FBRyxFQUFFLEtBQUs7WUFDVixLQUFLLEVBQUUsTUFBTTtZQUNiLFNBQVMsRUFBRSx5Q0FBYyxDQUFDLFdBQVc7WUFDckMsS0FBSyxFQUFFO2dCQUNMLFdBQVcsRUFBRSxDQUFDLG9DQUFTLENBQUMsSUFBSSxDQUFDO2FBQzlCO1lBQ0QsU0FBUyxFQUFFO2dCQUNULFFBQVEsRUFBRSxJQUFJO2FBQ2Y7U0FDRjtLQUNGO0lBRUQsY0FBYztJQUNkLFVBQVUsRUFBRTtRQUNWLElBQUksRUFBRSxvQ0FBUyxDQUFDLE1BQU07UUFDdEIsS0FBSyxFQUFFO1lBQ0wsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSw2RUFBNkU7YUFDckY7WUFDRCxVQUFVLEVBQUU7Z0JBQ1Y7b0JBQ0UsR0FBRyxFQUFFLElBQUk7b0JBQ1QsWUFBWSxFQUFFLElBQUk7b0JBQ2xCLElBQUksRUFBRSxvQ0FBUyxDQUFDLElBQUk7b0JBQ3BCLEtBQUssRUFBRSxJQUFJO29CQUNYLE1BQU0sRUFBRSxJQUFJO2lCQUNiO2dCQUNEO29CQUNFLEdBQUcsRUFBRSxPQUFPO29CQUNaLElBQUksRUFBRSxvQ0FBUyxDQUFDLElBQUk7b0JBQ3BCLEtBQUssRUFBRSxJQUFJO29CQUNYLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2dCQUNE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
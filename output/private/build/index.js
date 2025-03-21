"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const block_basekit_server_api_1 = require("@lark-opdev/block-basekit-server-api");
const { t } = block_basekit_server_api_1.field;
// 通过addDomainList添加请求接口的域名
block_basekit_server_api_1.basekit.addDomainList(['127.0.0.1']);
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
                    title: 'id',
                    hidden: true,
                },
                {
                    key: 'content',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '文案',
                    primary: true,
                },
                {
                    key: 'title',
                    type: block_basekit_server_api_1.FieldType.Text,
                    title: '标题',
                },
            ],
        },
    },
    authorizations: [
        {
            id: 'test-auth-key-123456', // 授权的id，用于context.fetch第三个参数以区分该请求使用哪个授权
            platform: 'baidu', // 需要与之授权的平台,比如baidu(必须要是已经支持的三方凭证,不可随便填写,如果想要支持更多的凭证，请填写申请表单)
            type: block_basekit_server_api_1.AuthorizationType.HeaderBearerToken,
            required: true, // 设置为选填，用户如果填了授权信息，请求中则会携带授权信息，否则不带授权信息
            instructionsUrl: "https://www.feishu.com", // 帮助链接，告诉使用者如何填写这个apikey
            label: '测试授权',
            icon: {
                light: '',
                dark: ''
            }
        }
    ],
    execute: async (formItemParams, context) => {
        // 获取字段值时需要正确处理字段结构
        const urlField = formItemParams.url;
        // 检查字段存在性
        if (!urlField || !urlField.length) {
            return {
                code: block_basekit_server_api_1.FieldCode.ConfigError,
                msg: '请先选择视频地址字段',
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
            const host_url = 'http://127.0.0.1:8000/api/script/transcribe';
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
                    'x-app-id': 'sheet-api',
                    'x-user-uuid': 'user-123456',
                    // 可选的用户昵称
                    // 'x-user-nickname': '晓山',
                    // 添加所有上下文信息到请求头
                    'x-base-signature': contextInfo.baseSignature || '',
                    'x-base-id': contextInfo.baseID || '',
                    'x-log-id': contextInfo.logID || '',
                    'x-table-id': contextInfo.tableID || '',
                    'x-pack-id': contextInfo.packID || '',
                    'x-tenant-key': contextInfo.tenantKey || '',
                    'x-time-zone': contextInfo.timeZone || '',
                    'x-base-owner-id': contextInfo.baseOwnerID || ''
                },
                body: JSON.stringify({
                    url: urlText,
                    context: contextInfo // 可选：将完整上下文信息作为请求体的一部分
                }),
            }, 'test-auth-key-123456');
            const res = await response.json();
            console.log('API响应:', res);
            // 检查响应是否成功，并从正确的路径提取数据
            if (res.code === 200 && res.data) {
                return {
                    code: block_basekit_server_api_1.FieldCode.Success,
                    data: {
                        id: `${Date.now()}`,
                        content: res.data.text || '无内容',
                        title: res.data.title || '无标题',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtRkFBOEg7QUFDOUgsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLGdDQUFLLENBQUM7QUFFcEIsMkJBQTJCO0FBQzNCLGtDQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUVyQyxrQ0FBTyxDQUFDLFFBQVEsQ0FBQztJQUNmLE9BQU8sRUFBRTtRQUNQLGlCQUFpQixFQUFFLElBQUksRUFBRSxTQUFTO0tBQ25DO0lBQ0QsU0FBUyxFQUFFO1FBQ1Q7WUFDRSxHQUFHLEVBQUUsS0FBSztZQUNWLEtBQUssRUFBRSxNQUFNO1lBQ2IsU0FBUyxFQUFFLHlDQUFjLENBQUMsV0FBVztZQUNyQyxLQUFLLEVBQUU7Z0JBQ0wsV0FBVyxFQUFFLENBQUMsb0NBQVMsQ0FBQyxJQUFJLENBQUM7YUFDOUI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLElBQUk7YUFDZjtTQUNGO0tBQ0Y7SUFDRCxjQUFjO0lBQ2QsVUFBVSxFQUFFO1FBQ1YsSUFBSSxFQUFFLG9DQUFTLENBQUMsTUFBTTtRQUN0QixLQUFLLEVBQUU7WUFDTCxJQUFJLEVBQUU7Z0JBQ0osS0FBSyxFQUFFLDZFQUE2RTthQUNyRjtZQUNELFVBQVUsRUFBRTtnQkFDVjtvQkFDRSxHQUFHLEVBQUUsSUFBSTtvQkFDVCxZQUFZLEVBQUUsSUFBSTtvQkFDbEIsSUFBSSxFQUFFLG9DQUFTLENBQUMsSUFBSTtvQkFDcEIsS0FBSyxFQUFFLElBQUk7b0JBQ1gsTUFBTSxFQUFFLElBQUk7aUJBQ2I7Z0JBQ0Q7b0JBQ0UsR0FBRyxFQUFFLFNBQVM7b0JBQ2QsSUFBSSxFQUFFLG9DQUFTLENBQUMsSUFBSTtvQkFDcEIsS0FBSyxFQUFFLElBQUk7b0JBQ1gsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7Z0JBQ0Q7b0JBQ0UsR0FBRyxF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
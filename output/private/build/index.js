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
            // 使用类型断言获取 baseSignature 和 packID
            const baseSignature = context.baseSignature;
            const packID = context.packID;
            console.log('流量标识信息:', {
                baseSignature,
                packID
            });
            const response = await context.fetch(host_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-source': 'feishu-sheet',
                    'x-app-id': 'sheet-api',
                    'x-user-uuid': 'user-123456',
                    // 'x-user-nickname': '晓山',
                    'x-base-signature': baseSignature,
                    'x-pack-id': packID
                },
                body: JSON.stringify({ url: urlText }),
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
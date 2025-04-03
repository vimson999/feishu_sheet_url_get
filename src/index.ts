import { basekit, FieldType, field, FieldComponent, FieldCode,AuthorizationType } from '@lark-opdev/block-basekit-server-api';
const { t } = field;

// 通过addDomainList添加请求接口的域名
basekit.addDomainList(['127.0.0.1']);

basekit.addField({
  options: {
    disableAutoUpdate: true, // 关闭自动更新
  },
  formItems: [
    {
      key: 'url',
      label: '视频地址',
      component: FieldComponent.FieldSelect,
      props: {
        supportType: [FieldType.Text],
      },
      validator: {
        required: true,
      }
    },
  ],
  
  // 定义捷径的返回结果类型
  resultType: {
    type: FieldType.Object,
    extra: {
      icon: {
        light: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/eqgeh7upeubqnulog/chatbot.svg',
      },
      properties: [
        {
          key: 'id',
          isGroupByKey: true,
          type: FieldType.Text,
          title: 'ID',
          hidden: true,
        },
        {
          key: 'title',
          type: FieldType.Text,
          title: '标题',
          primary: true,
        },
        {
          key: 'authorName',
          type: FieldType.Text,
          title: '作者',
        },

        {
          key: 'description',
          type: FieldType.Text,
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
          type: FieldType.Number,
          title: '点赞数',
        },
        {
          key: 'collectCount',
          type: FieldType.Number,
          title: '收藏数',
        },
        {
          key: 'shareCount',
          type: FieldType.Number,
          title: '转发数',
        },
        {
          key: 'commentCount',
          type: FieldType.Number,
          title: '评论数',
        },
        {
          key: 'tags',
          type: FieldType.Text,
          title: '标签',
        },
        {
          key: 'coverUrl',
          type: FieldType.Text,
          title: '封面地址',
        },
        {
          key: 'videoUrl',
          type: FieldType.Text,
          title: '视频下载地址',
        },
        {
          key: 'content',
          type: FieldType.Text,
          title: '文案',
        }
      ],
    },
  },
  authorizations: [
    {
      id: 'test-auth-key-123456',// 授权的id，用于context.fetch第三个参数以区分该请求使用哪个授权
      platform: 'baidu',// 需要与之授权的平台,比如baidu(必须要是已经支持的三方凭证,不可随便填写,如果想要支持更多的凭证，请填写申请表单)
      type: AuthorizationType.HeaderBearerToken,
      required: true,// 设置为选填，用户如果填了授权信息，请求中则会携带授权信息，否则不带授权信息
      instructionsUrl: "https://www.feishu.com",// 帮助链接，告诉使用者如何填写这个apikey
      label: '测试授权',
      icon: {
        light: '',
        dark: ''
      }
    }
  ],
  execute: async (formItemParams, context) => {
    /** 为方便查看日志，使用此方法替代console.log */
    function debugLog(arg: any) {
      console.log(JSON.stringify({
        formItemParams,
        context,
        arg
      }))
    }

    // 获取字段值时需要正确处理字段结构
    const urlField = formItemParams.url;
    // 使用默认参数值，而不是从表单获取
    const extractText = true;  // 默认提取文案
    const includeComments = false;  // 默认不包含评论
    
    // 检查字段存在性
    if (!urlField || !urlField.length) {
      return {
        code: FieldCode.ConfigError,
        msg: '请先选择媒体链接字段',
      };
    }
    
    // 从文本字段中提取实际的URL文本
    let urlText = '';
    for (const item of urlField) {
      if (item.type === 'text') {
        urlText += item.text;
      } else if (item.type === 'url') {
        urlText += item.link;
      }
    }
    
    if (!urlText) {
      return {
        code: FieldCode.ConfigError,
        msg: '未能从所选字段中提取有效的URL',
      };
    }

    console.log('从字段中提取的URL:', urlText);

    try {
      // 切换到新的媒体提取API
      const host_url = 'http://127.0.0.1:8000/api/media/extract';
      
      // 获取完整的上下文信息
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
          context: contextInfo  // 可选：将完整上下文信息作为请求体的一部分
        }),
      }, 'd9fed99f5149867b1271170492f592b088ea3d68c97dc8edb7d5c46ebe16f484');
      

      const res = await response.json();
      console.log('API响应:', res);
      
      /** 为方便查看日志，使用此方法替代console.log */
    function debugLog(arg: any) {
      console.log(JSON.stringify({
        res
      }))
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
          code: FieldCode.Success,
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
      } else {
        return {
          code: FieldCode.Error,
          msg: `API响应错误: ${res.message || '未知错误'}`,
        };
      }
    } catch (e) {
      console.error('请求失败:', e);
      return {
        code: FieldCode.Error,
        msg: `请求失败: ${e.message}`
      };
    }
  },
});

export default basekit;
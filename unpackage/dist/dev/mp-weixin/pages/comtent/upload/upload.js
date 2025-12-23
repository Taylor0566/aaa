"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "upload",
  setup(__props) {
    const formData = common_vendor.ref(new UTSJSONObject({
      title: "",
      description: "",
      type: "text",
      mediaLocalPath: "",
      mediaUrl: "",
      tags: []
    }));
    const rawTags = common_vendor.ref("");
    const previewUrl = common_vendor.ref("");
    const mediaError = common_vendor.ref("");
    const isSubmitting = common_vendor.ref(false);
    common_vendor.watch(() => {
      return rawTags.value;
    }, (newVal) => {
      if (!newVal) {
        formData.value.tags = [];
        return null;
      }
      const tags = newVal.split(",").map((t) => {
        return t.trim();
      }).filter((t) => {
        return t;
      }).slice(0, 5);
      formData.value.tags = [...new Set(tags)];
    });
    function setContentType(type) {
      formData.value.type = type;
      formData.value.mediaLocalPath = "";
      formData.value.mediaUrl = "";
      previewUrl.value = "";
      mediaError.value = "";
    }
    function selectMedia() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        try {
          mediaError.value = "";
          if (formData.value.type === "image") {
            const res = yield common_vendor.index.chooseImage(new UTSJSONObject({ count: 1, sizeType: ["compressed"] }));
            if (res.tempFilePaths.length === 0)
              return Promise.resolve(null);
            const tempPath = res.tempFilePaths[0];
            previewUrl.value = tempPath;
            formData.value.mediaLocalPath = tempPath;
          } else if (formData.value.type === "video") {
            const res = yield common_vendor.index.chooseVideo(new UTSJSONObject({
              maxDuration: 60,
              camera: "back"
            }));
            if (res.duration > 60) {
              mediaError.value = "视频时长不能超过60秒";
              return Promise.resolve(null);
            }
            previewUrl.value = res.tempFilePath;
            formData.value.mediaLocalPath = res.tempFilePath;
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/comtent/upload/upload.uvue:159", "选择媒体失败:", err);
          mediaError.value = "选择失败，请重试";
        }
      });
    }
    function uploadToAliyun(localPath, fileType) {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        const timestamp = Date.now();
        const extMatch = localPath.match(/\.([^.]+)$/i);
        const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
        const userId = "anonymous";
        const cloudPath = `posts/${fileType}/${userId}_${timestamp}.${ext}`;
        try {
          const res = yield common_vendor.er.uploadFile({
            filePath: localPath,
            cloudPath,
            onUploadProgress(progressEvent) {
              const percent = Math.round(progressEvent.loaded * 100 / progressEvent.total);
              common_vendor.index.__f__("log", "at pages/comtent/upload/upload.uvue:179", "上传进度:", percent + "%");
            }
          });
          if (res.fileID) {
            return res.fileID;
          } else {
            throw new Error(res.errorMessage || "上传失败");
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/comtent/upload/upload.uvue:189", "上传失败:", err);
          throw new Error("网络错误，请重试");
        }
      });
    }
    function submitPost() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        if (!formData.value.title.trim()) {
          common_vendor.index.showToast({ title: "请输入标题", icon: "none" });
          return Promise.resolve(null);
        }
        if (formData.value.type !== "text" && !formData.value.mediaLocalPath) {
          common_vendor.index.showToast({ title: "请上传媒体文件", icon: "none" });
          return Promise.resolve(null);
        }
        isSubmitting.value = true;
        try {
          let mediaUrl = "";
          if (formData.value.type !== "text") {
            mediaUrl = yield uploadToAliyun(formData.value.mediaLocalPath, formData.value.type);
          }
          const postData = new UTSJSONObject(
            {
              title: formData.value.title.trim(),
              description: formData.value.description.trim(),
              type: formData.value.type,
              mediaUrl,
              tags: formData.value.tags
            }
            // 👇【需要后端 API】：发布内容到你的服务器
            /*
                const response = await uni.request({
                  url: 'https://your-api.com/posts/create',
                  method: 'POST',
                  data: postData
                })
            
                if (response.statusCode === 200) {
                  uni.showToast({ title: '发布成功！', icon: 'success' })
                  setTimeout(() => uni.navigateBack(), 1500)
                } else {
                  throw new Error('发布失败')
                }
                */
            // ✅ 模拟成功
          );
          common_vendor.index.__f__("log", "at pages/comtent/upload/upload.uvue:242", "✅ 模拟发布成功:", postData);
          common_vendor.index.showToast({ title: "发布成功！", icon: "success" });
          setTimeout(() => {
            return common_vendor.index.navigateBack();
          }, 1500);
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/comtent/upload/upload.uvue:247", "发布失败:", err);
          common_vendor.index.showToast({ title: err.message || "发布失败", icon: "none" });
        } finally {
          isSubmitting.value = false;
        }
      });
    }
    return (_ctx, _cache) => {
      "raw js";
      const __returned__ = common_vendor.e({
        a: common_vendor.unref(formData).title,
        b: common_vendor.o(($event) => {
          return common_vendor.unref(formData).title = $event.detail.value;
        }),
        c: common_vendor.unref(formData).description,
        d: common_vendor.o(($event) => {
          return common_vendor.unref(formData).description = $event.detail.value;
        }),
        e: common_vendor.unref(rawTags),
        f: common_vendor.o(($event) => {
          return common_vendor.isRef(rawTags) ? rawTags.value = $event.detail.value : null;
        }),
        g: common_vendor.unref(formData).type === "text" ? 1 : "",
        h: common_vendor.o(($event) => {
          return setContentType("text");
        }),
        i: common_vendor.unref(formData).type === "image" ? 1 : "",
        j: common_vendor.o(($event) => {
          return setContentType("image");
        }),
        k: common_vendor.unref(formData).type === "video" ? 1 : "",
        l: common_vendor.o(($event) => {
          return setContentType("video");
        }),
        m: common_vendor.unref(formData).type !== "text"
      }, common_vendor.unref(formData).type !== "text" ? common_vendor.e({
        n: common_vendor.t(common_vendor.unref(formData).type === "image" ? "选择图片" : "选择视频"),
        o: common_vendor.o(selectMedia),
        p: common_vendor.unref(previewUrl)
      }, common_vendor.unref(previewUrl) ? common_vendor.e({
        q: common_vendor.unref(formData).type === "image"
      }, common_vendor.unref(formData).type === "image" ? {
        r: common_vendor.unref(previewUrl)
      } : common_vendor.unref(formData).type === "video" ? {
        t: common_vendor.unref(previewUrl)
      } : {}, {
        s: common_vendor.unref(formData).type === "video"
      }) : {}, {
        v: common_vendor.unref(mediaError)
      }, common_vendor.unref(mediaError) ? {
        w: common_vendor.t(common_vendor.unref(mediaError))
      } : {}) : {}, {
        x: common_vendor.t(common_vendor.unref(isSubmitting) ? "发布中..." : "发布内容"),
        y: common_vendor.o(submitPost),
        z: common_vendor.unref(isSubmitting),
        A: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
      });
      return __returned__;
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2b08a3b0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/comtent/upload/upload.js.map

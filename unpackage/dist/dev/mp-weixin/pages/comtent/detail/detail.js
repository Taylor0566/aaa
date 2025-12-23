"use strict";
const common_vendor = require("../../../common/vendor.js");
const defaultAvatar = "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-dc-site/0a8dfc00-2b0d-11eb-b6f6-39e5ff889326.png";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "detail",
  setup(__props) {
    const contentId = common_vendor.ref("");
    const post = common_vendor.ref(new UTSJSONObject({}));
    const comments = common_vendor.ref([]);
    const newComment = common_vendor.ref("");
    const rating = common_vendor.ref(5);
    const avgRating = common_vendor.ref(0);
    const totalRatings = common_vendor.ref(0);
    const showDeleteConfirm = common_vendor.ref(false);
    const deleteTarget = common_vendor.ref(null);
    common_vendor.onLoad((options = null) => {
      contentId.value = options.id;
      if (contentId.value) {
        loadPostDetail();
        loadComments();
        loadRatingStats();
      }
    });
    function loadPostDetail() {
      var _a, _b, _c;
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        try {
          const res = yield common_vendor.er.callFunction({
            name: "post-api",
            data: new UTSJSONObject({
              action: "get-post",
              postId: contentId.value
            })
          });
          if ((_a = res.result) === null || _a === void 0 ? null : _a.success) {
            post.value = res.result.data;
            if (post.value.fileID && !post.value.mediaUrl) {
              const urlRes = yield common_vendor.er.getTempFileURL({ fileList: [post.value.fileID] });
              post.value.mediaUrl = ((_b = urlRes.fileList[0]) === null || _b === void 0 ? null : _b.tempFileURL) || "";
            }
          } else {
            throw new Error(((_c = res.result) === null || _c === void 0 ? null : _c.message) || "加载失败");
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/comtent/detail/detail.uvue:154", "加载帖子失败:", err);
          common_vendor.index.showToast({ title: "加载失败", icon: "none" });
        }
      });
    }
    function loadComments(page = 1) {
      var _a;
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        try {
          const res = yield common_vendor.er.callFunction({
            name: "comment-api",
            data: new UTSJSONObject({
              action: "list-comments",
              contentId: contentId.value,
              page,
              pageSize: 20
            })
          });
          if ((_a = res.result) === null || _a === void 0 ? null : _a.success) {
            comments.value = res.result.data.list || [];
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/comtent/detail/detail.uvue:174", "加载评论失败:", err);
          common_vendor.index.showToast({ title: "评论加载失败", icon: "none" });
        }
      });
    }
    function loadRatingStats() {
      var _a;
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        try {
          const res = yield common_vendor.er.callFunction({
            name: "comment-api",
            data: new UTSJSONObject({
              action: "get-content-rating",
              contentId: contentId.value
            })
          });
          if ((_a = res.result) === null || _a === void 0 ? null : _a.success) {
            avgRating.value = res.result.data.avgRating || 0;
            totalRatings.value = res.result.data.total || 0;
          }
        } catch (err) {
          common_vendor.index.__f__("warn", "at pages/comtent/detail/detail.uvue:193", "加载评分失败:", err);
        }
      });
    }
    function submitComment() {
      var _a, _b;
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        if (!newComment.value.trim())
          return Promise.resolve(null);
        try {
          const res = yield common_vendor.er.callFunction({
            name: "comment-api",
            data: new UTSJSONObject({
              action: "add-comment",
              contentId: contentId.value,
              commentContent: newComment.value.trim(),
              rating: rating.value
            })
          });
          if ((_a = res.result) === null || _a === void 0 ? null : _a.success) {
            common_vendor.index.showToast({ title: "评论成功", icon: "success" });
            newComment.value = "";
            rating.value = 5;
            loadComments();
            loadRatingStats();
          } else {
            throw new Error(((_b = res.result) === null || _b === void 0 ? null : _b.message) || "评论失败");
          }
        } catch (err) {
          common_vendor.index.showToast({ title: err.message || "评论失败", icon: "none" });
        }
      });
    }
    function deleteComment(commentId = null) {
      var _a, _b;
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        try {
          const res = yield common_vendor.er.callFunction({
            name: "comment-api",
            data: new UTSJSONObject({
              action: "delete-comment",
              commentId
            })
          });
          if ((_a = res.result) === null || _a === void 0 ? null : _a.success) {
            loadComments();
            loadRatingStats();
          } else {
            throw new Error(((_b = res.result) === null || _b === void 0 ? null : _b.message) || "删除失败");
          }
        } catch (err) {
          common_vendor.index.showToast({ title: err.message || "删除失败", icon: "none" });
        }
      });
    }
    function onRatingChange(e = null) {
      rating.value = parseInt(e.detail.value) + 1;
    }
    function confirmDeleteComment(comment = null) {
      deleteTarget.value = comment;
      showDeleteConfirm.value = true;
    }
    function confirmDeletePost() {
      deleteTarget.value = "post";
      showDeleteConfirm.value = true;
    }
    function cancelDelete() {
      showDeleteConfirm.value = false;
      deleteTarget.value = null;
    }
    function doDelete() {
      var _a;
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        if (deleteTarget.value === "post") {
          common_vendor.index.showToast({ title: "帖子删除成功", icon: "success" });
          setTimeout(() => {
            return common_vendor.index.navigateBack();
          }, 1e3);
        } else if ((_a = deleteTarget.value) === null || _a === void 0 ? null : _a._id) {
          yield deleteComment(deleteTarget.value._id);
        }
        cancelDelete();
      });
    }
    function editPost() {
      common_vendor.index.navigateTo({ url: `/pages/content/edit/edit?id=${contentId.value}` });
    }
    function previewImage() {
      if (post.value.mediaUrl) {
        common_vendor.index.previewImage({ urls: [post.value.mediaUrl] });
      }
    }
    function formatTime(dateStr = null) {
      if (!dateStr)
        return "";
      const date = new Date(dateStr);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).replace(/\//g, "-");
    }
    return (_ctx, _cache) => {
      "raw js";
      const __returned__ = common_vendor.e({
        a: post.value.avatarUrl || defaultAvatar,
        b: common_vendor.t(post.value.author || "匿名用户"),
        c: common_vendor.t(formatTime(post.value.createdAt)),
        d: post.value.isMine
      }, post.value.isMine ? {
        e: common_vendor.o(editPost),
        f: common_vendor.o(confirmDeletePost)
      } : {}, {
        g: common_vendor.t(post.value.title),
        h: post.value.description
      }, post.value.description ? {
        i: common_vendor.t(post.value.description)
      } : {}, {
        j: post.value.type === "image"
      }, post.value.type === "image" ? {
        k: post.value.mediaUrl,
        l: common_vendor.o(previewImage)
      } : post.value.type === "video" ? {
        n: post.value.mediaUrl
      } : {}, {
        m: post.value.type === "video",
        o: common_vendor.t(post.value.views),
        p: common_vendor.t(post.value.likes),
        q: common_vendor.t(avgRating.value.toFixed(1)),
        r: common_vendor.t(totalRatings.value),
        s: common_vendor.t(comments.value.length),
        t: common_vendor.f(comments.value, (comment, k0, i0) => {
          return common_vendor.e({
            a: comment.avatarUrl || defaultAvatar,
            b: common_vendor.t(comment.authorName || "匿名"),
            c: common_vendor.t(formatTime(comment.createdAt)),
            d: common_vendor.t(comment.commentContent),
            e: common_vendor.t(comment.rating),
            f: comment.isMyComment
          }, comment.isMyComment ? {
            g: common_vendor.o(($event) => {
              return confirmDeleteComment(comment);
            }, comment._id)
          } : {}, {
            h: comment._id
          });
        }),
        v: comments.value.length === 0
      }, comments.value.length === 0 ? {} : {}, {
        w: common_vendor.o(submitComment),
        x: newComment.value,
        y: common_vendor.o(($event) => {
          return newComment.value = $event.detail.value;
        }),
        z: common_vendor.t(rating.value),
        A: common_vendor.o(onRatingChange),
        B: rating.value - 1,
        C: [1, 2, 3, 4, 5],
        D: common_vendor.o(submitComment),
        E: !newComment.value.trim(),
        F: showDeleteConfirm.value
      }, showDeleteConfirm.value ? {
        G: common_vendor.o(cancelDelete),
        H: common_vendor.o(doDelete)
      } : {}, {
        I: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
      });
      return __returned__;
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1026b34d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/comtent/detail/detail.js.map

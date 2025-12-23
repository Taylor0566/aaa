"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      userInfo: new UTSJSONObject({
        _id: "",
        username: "",
        nickname: "",
        avatar: "",
        gender: 0,
        email: "",
        mobile: "",
        register_date: ""
      }),
      userStats: new UTSJSONObject({
        content_count: 0,
        comment_count: 0,
        like_count: 0
      }),
      loading: true,
      isUpdating: false,
      defaultAvatar: "https://ruangong-dazuoye-file.oss-cn-shenzhen.aliyuncs.com/%E9%AB%98%E9%9B%85%E4%BC%81%E9%B9%85.jpg",
      genderOptions: [
        new UTSJSONObject({ value: 0, label: "未知" }),
        new UTSJSONObject({ value: 1, label: "男" }),
        new UTSJSONObject({ value: 2, label: "女" })
      ]
    };
  },
  onLoad() {
    const token = common_vendor.index.getStorageSync("uni_id_token");
    common_vendor.index.__f__("log", "at pages/user/profile/profile.uvue:130", "【当前 token】:", UTS.JSON.stringify(token));
    this.fetchUserInfo();
  },
  onPullDownRefresh() {
    this.fetchUserInfo();
  },
  computed: {
    // 用于 picker 的当前索引（解决 picker value 必须是 index 的问题）
    getCurrentGenderIndex() {
      const index = this.genderOptions.findIndex((opt) => {
        return opt.value === this.userInfo.gender;
      });
      return index === -1 ? 0 : index;
    }
  },
  methods: {
    fetchUserInfo() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        this.loading = true;
        try {
          const res = yield common_vendor.er.callFunction({
            name: "user-api",
            data: new UTSJSONObject({
              action: "get_profile"
            })
          });
          const result = res.result || new UTSJSONObject({});
          if (result.code === 200 && result.data) {
            const data = result.data;
            if (data.profile) {
              this.userInfo = Object.assign({}, data.profile);
              this.userStats = Object.assign({}, data.stats) || {};
            } else {
              this.userInfo = Object.assign({}, data);
            }
            if (!this.userInfo.avatar) {
              this.userInfo.avatar = this.defaultAvatar;
            }
          } else {
            throw new Error(result.message || "获取用户信息失败");
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/user/profile/profile.uvue:179", "获取用户信息异常:", err);
          common_vendor.index.showToast({
            title: "获取信息失败，请重试",
            icon: "none",
            duration: 2e3
          });
        } finally {
          this.loading = false;
          common_vendor.index.stopPullDownRefresh();
        }
      });
    },
    updateNickname() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        const newNickname = (this.userInfo.nickname || "").trim();
        if (!newNickname) {
          common_vendor.index.showToast({ title: "昵称不能为空", icon: "none" });
          return Promise.resolve(null);
        }
        this.isUpdating = true;
        try {
          const res = yield common_vendor.er.callFunction({
            name: "user-api",
            data: new UTSJSONObject({
              action: "profile",
              nickname: newNickname
            })
          });
          const result = res.result || new UTSJSONObject({});
          if (result.code === 0) {
            common_vendor.index.showToast({ title: "昵称更新成功", icon: "success" });
          } else {
            common_vendor.index.showToast({ title: result.message || "更新失败", icon: "none" });
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/user/profile/profile.uvue:215", "更新昵称失败:", err);
          common_vendor.index.showToast({ title: "网络错误，请重试", icon: "none" });
        } finally {
          this.isUpdating = false;
        }
      });
    },
    onGenderChange(e = null) {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        const selectedIndex = e.detail.value;
        const newGender = this.genderOptions[selectedIndex].value;
        if (newGender === this.userInfo.gender)
          return Promise.resolve(null);
        this.isUpdating = true;
        try {
          const res = yield common_vendor.er.callFunction({
            name: "user-api",
            data: new UTSJSONObject({
              action: "update_profile",
              gender: newGender
            })
          });
          const result = res.result || new UTSJSONObject({});
          if (result.code === 0) {
            this.userInfo.gender = newGender;
            common_vendor.index.showToast({ title: "性别更新成功", icon: "success" });
          } else {
            common_vendor.index.showToast({ title: result.message || "更新失败", icon: "none" });
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/user/profile/profile.uvue:246", "更新性别失败:", err);
          common_vendor.index.showToast({ title: "网络错误，请重试", icon: "none" });
        } finally {
          this.isUpdating = false;
        }
      });
    },
    getGenderLabel(gender = null) {
      const option = UTS.arrayFind(this.genderOptions, (opt) => {
        return opt.value === gender;
      });
      return option ? option.label : "未知";
    },
    formatDate(timestamp = null) {
      if (!timestamp)
        return "未知";
      const date = new Date(timestamp);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    },
    refreshUserInfo() {
      this.fetchUserInfo();
    },
    logout() {
      common_vendor.index.showModal(new UTSJSONObject({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          return common_vendor.__awaiter(this, void 0, void 0, function* () {
            if (res.confirm) {
              try {
                yield common_vendor.er.callFunction({
                  name: "user-api",
                  data: new UTSJSONObject({ action: "logout" })
                });
              } catch (err) {
                common_vendor.index.__f__("warn", "at pages/user/profile/profile.uvue:284", "登出接口调用失败（可忽略）:", err);
              } finally {
                common_vendor.index.removeStorageSync("uni_id_token");
                common_vendor.index.removeStorageSync("user_info");
                common_vendor.index.redirectTo({ url: "/pages/user/login/login" });
              }
            }
          });
        }
      }));
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  "raw js";
  return common_vendor.e({
    a: $data.loading
  }, $data.loading ? {} : common_vendor.e({
    b: $data.userInfo.avatar || $data.defaultAvatar,
    c: common_vendor.t($data.userInfo._id),
    d: common_vendor.t($data.userInfo.username),
    e: common_vendor.o((...args) => $options.updateNickname && $options.updateNickname(...args)),
    f: $data.isUpdating,
    g: $data.userInfo.nickname,
    h: common_vendor.o(($event) => $data.userInfo.nickname = $event.detail.value),
    i: $data.isUpdating
  }, $data.isUpdating ? {} : {}, {
    j: common_vendor.t($options.getGenderLabel($data.userInfo.gender)),
    k: $options.getCurrentGenderIndex,
    l: $data.genderOptions,
    m: common_vendor.o((...args) => $options.onGenderChange && $options.onGenderChange(...args)),
    n: $data.isUpdating,
    o: $data.userInfo.email
  }, $data.userInfo.email ? {
    p: common_vendor.t($data.userInfo.email)
  } : {}, {
    q: $data.userInfo.mobile
  }, $data.userInfo.mobile ? {
    r: common_vendor.t($data.userInfo.mobile)
  } : {}, {
    s: common_vendor.t($options.formatDate($data.userInfo.register_date)),
    t: common_vendor.t($data.userStats.content_count || 0),
    v: common_vendor.t($data.userStats.comment_count || 0),
    w: common_vendor.t($data.userStats.like_count || 0)
  }), {
    x: common_vendor.o((...args) => $options.refreshUserInfo && $options.refreshUserInfo(...args)),
    y: $data.loading,
    z: common_vendor.o((...args) => $options.logout && $options.logout(...args)),
    A: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-678bd6b2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/profile/profile.js.map

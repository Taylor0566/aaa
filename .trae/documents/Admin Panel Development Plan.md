# Admin Panel Development Plan

## 1. Backend: Admin Authentication & API (Cloud Functions)
To resolve the mismatch between `admin-api` (expecting uni-id tokens) and `admin-operation` (using custom JWT for `admin_users`), I will unify the authentication logic.

### 1.1 Create Common Auth Module
*   **Path**: `uniCloud-aliyun/cloudfunctions/common/admin-auth/index.js`
*   **Content**: Extract `createAdminToken`, `verifyAdminToken`, `hashPassword`, `verifyPassword` from `admin-operation`.
*   **Purpose**: Shared authentication logic for all admin-related cloud functions.

### 1.2 Refactor `admin-operation`
*   **Update**: Use the new `admin-auth` common module.
*   **New Feature**: Implement `register` method.
    *   Generates a random password if not provided (Dynamic Generation).
    *   Encrypts/Hashes password before storage (Secure Storage).
    *   Stores in `admin_users` collection.

### 1.3 Refactor `admin-api`
*   **Update**: Change `index.js` to use `admin-auth.verifyAdminToken` instead of `uni-id-common.checkToken`.
*   **Benefit**: Allows the frontend to use the token returned by `admin-operation/login` to call `admin-api` endpoints.

## 2. Frontend: Pages & Logic (Admin Project)

### 2.1 Login Page
*   **File**: `admin/pages/login/login.uvue`
*   **Features**: Username/Password form, calls `admin-operation.login`.
*   **Storage**: Saves token to `uni.setStorageSync('adminToken')`.

### 2.2 Detail Pages
*   **User Detail**: `admin/pages/user/detail.uvue`
    *   Displays user info, content count, comment count.
    *   Shows operation logs (mocked or fetched if available).
*   **Content Detail**: `admin/pages/content/detail.uvue`
    *   Displays content body, media, author info, stats.
    *   Includes audit action buttons.

### 2.3 Update Existing Pages
*   **Routing**: Update `admin/pages.json` to include new pages.
*   **Guards**: Add check in `onShow` or `onLoad` in Dashboard/User/Content pages to redirect to login if no token exists.

## 3. Implementation Steps
1.  **Create Common Auth**: Setup `admin-auth` module.
2.  **Update Cloud Functions**: Refactor `admin-operation` and `admin-api`.
3.  **Frontend Pages**: Create Login and Detail pages.
4.  **Configuration**: Update `pages.json`.
5.  **Verification**: Test login flow, token verification, and data retrieval.

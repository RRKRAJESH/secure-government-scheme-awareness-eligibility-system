# 🚀 Quick Reference Guide

Use this for quick lookups on how to use the new frontend structure.

## 📦 Import Patterns

### Configuration

```javascript
// Import endpoints
import API_ENDPOINTS from "../config/api.config";
// Usage: API_ENDPOINTS.AUTH_LOGIN

// Import constants
import {
  ROUTES,
  ROLES,
  STORAGE_KEYS,
  REGEX_PATTERNS,
} from "../config/constants";
// Usage: ROUTES.HOME, ROLES.USER
```

### Hooks

```javascript
// Auth hook
import { useAuth } from "../hooks/useAuth";
const { getToken, getRole, isAuthenticated, login, logout } = useAuth();

// API hook
import { useApi } from "../hooks/useApi";
const { apiRequest } = useApi();

// Profile status hook
import useProfileStatus from "../hooks/useProfileStatus";
const { profileData, loading, profileCompletion, isProfileComplete } =
  useProfileStatus();
```

### Components

```javascript
// Auth form (Login/Signup)
import AuthForm from "../components/AuthForm";

// Form sections (UpdateProfile building blocks)
import {
  BasicInfoSection,
  CommunicationInfoSection,
  EducationInfoSection,
  BeneficiaryInfoSection,
} from "../components/FormSections";

// Other components
import FormButtonGroup from "../components/FormButtonGroup";
import LoadingSpinner from "../components/LoadingSpinner";
```

## 🔐 Authentication

### Login

```javascript
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import API_ENDPOINTS from "../config/api.config";
import { ROUTES } from "../config/constants";

const { login } = useAuth();
const navigate = useNavigate();

// After successful API call:
login(token, role);
navigate(ROUTES.HOME);
```

### Logout

```javascript
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../config/constants";

const { logout } = useAuth();

const handleLogout = () => {
  logout();
  window.location.href = ROUTES.LOGIN;
};
```

### Check Auth

```javascript
import { useAuth } from "../hooks/useAuth";

const { getToken, getRole, isAuthenticated } = useAuth();

if (!isAuthenticated()) {
  navigate(ROUTES.LOGIN);
}

const userRole = getRole(); // "USER" or "ADMIN"
```

## 🌐 API Calls

### Basic Request

```javascript
import { useApi } from "../hooks/useApi";
import API_ENDPOINTS from "../config/api.config";

const { apiRequest } = useApi();

// GET request
const data = await apiRequest(API_ENDPOINTS.PROFILE_STATUS, "GET");

// POST request
const response = await apiRequest(API_ENDPOINTS.PROFILE_UPDATE, "POST", {
  payload: "data",
});
```

### Error Handling

```javascript
import { message } from "antd";

try {
  const data = await apiRequest(url, "GET");
  message.success("Success!");
} catch (error) {
  message.error(error.message);
  console.error("API Error:", error);
}
```

## 📝 Forms

### Using AuthForm Component

```javascript
import AuthForm from "../components/AuthForm";

<AuthForm
  isLogin={true}
  isAdmin={false}
  loading={loading}
  onSubmit={handleSubmit}
  submitText="Sign In"
/>;
```

### Using Form Sections

```javascript
import { BasicInfoSection } from "../components/FormSections";
import { Form } from "antd";

<Form form={form} layout="vertical">
  <BasicInfoSection />
  {/* Form continues... */}
</Form>;
```

### Form Submission

```javascript
const [form] = Form.useForm();

const handleSubmit = async (values) => {
  // values contains form data
  console.log(values);
};

<Form form={form} onFinish={handleSubmit}>
  {/* Form items */}
</Form>;
```

## 🎯 Navigation

### Routes

```javascript
import { ROUTES } from "../config/constants";
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

navigate(ROUTES.HOME); // /home
navigate(ROUTES.LOGIN); // /
navigate(ROUTES.DASHBOARD); // /dashboard
navigate(ROUTES.UPDATE_PROFILE); // /update-profile
```

## 💾 State Management

### Profile Status

```javascript
import useProfileStatus from "../hooks/useProfileStatus";

const {
  profileData, // User profile data
  loading, // Loading state
  error, // Error message
  profileCompletion, // 0-100 percentage
  isProfileComplete, // Boolean
  refetch, // Function to refetch
} = useProfileStatus();

// Use in components
{
  loading && <LoadingSpinner isLoading={true} />;
}
{
  error && <message.error>{error}</message.error>;
}
```

## 🎨 Constants

### Roles

```javascript
import { ROLES, ROLE_COLORS } from "../config/constants";

ROLES.USER; // "USER"
ROLES.ADMIN; // "ADMIN"

ROLE_COLORS[ROLES.USER]; // "#52c41a" (green)
ROLE_COLORS[ROLES.ADMIN]; // "#fa8c16" (orange)
```

### Routes

```javascript
import { ROUTES } from "../config/constants";

ROUTES.LOGIN; // "/"
ROUTES.SIGNUP; // "/signup"
ROUTES.HOME; // "/home"
ROUTES.DASHBOARD; // "/dashboard"
ROUTES.UPDATE_PROFILE; // "/update-profile"
ROUTES.ADMIN; // "/admin"
```

### Form Options

```javascript
import {
  DISTRICTS,
  QUALIFICATIONS,
  FARMER_CATEGORIES,
  SOCIAL_CATEGORIES,
  AGRICULTURE_TYPES,
} from "../config/constants";

// Use in Select components:
<Select>
  {DISTRICTS.map((d) => (
    <Select.Option key={d} value={d}>
      {d}
    </Select.Option>
  ))}
</Select>;
```

### Storage Keys

```javascript
import { STORAGE_KEYS } from "../config/constants";

STORAGE_KEYS.ACCESS_TOKEN; // "access_token"
STORAGE_KEYS.ROLE; // "role"
```

### Regex Patterns

```javascript
import { REGEX_PATTERNS } from "../config/constants";

REGEX_PATTERNS.PHONE; // /^[6-9]\d{9}$/
REGEX_PATTERNS.EMAIL; // /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/
REGEX_PATTERNS.POSTAL_CODE; // /^[0-9]{6}$/
```

## ⚙️ Common Patterns

### Protected Route

```javascript
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ProtectedPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return <div>Protected Content</div>;
};
```

### With Loading Spinner

```javascript
import LoadingSpinner from "../components/LoadingSpinner";
import useProfileStatus from "../hooks/useProfileStatus";

const MyPage = () => {
  const { profileData, loading } = useProfileStatus();

  if (loading) return <LoadingSpinner isLoading={true} />;

  return <div>{profileData.username}</div>;
};
```

### With Error Handling

```javascript
import { message } from "antd";

try {
  const data = await apiRequest(url, "GET");
  message.success("Data loaded!");
} catch (error) {
  message.error(error.message || "Failed to load");
}
```

### useCallback Pattern

```javascript
import { useCallback } from "react";

const MyComponent = ({ id }) => {
  const handleClick = useCallback(() => {
    // Do something with id
    console.log(id);
  }, [id]); // Include dependencies

  return <button onClick={handleClick}>Click</button>;
};
```

## 🆕 Adding New Features

### New Page

1. Create file: `src/pages/NewPage.jsx`
2. Use hooks as needed
3. Import constants and components
4. Add route to `App.jsx`

### New API Endpoint

1. Add to [config/api.config.js](../config/api.config.js):
   ```javascript
   NEW_ENDPOINT: `${API_BASE_URL}/api/v1/new/endpoint`,
   ```
2. Use in component:
   ```javascript
   const data = await apiRequest(API_ENDPOINTS.NEW_ENDPOINT, "GET");
   ```

### New Constant

1. Add to [config/constants.js](../config/constants.js)
2. Import and use:
   ```javascript
   import { MY_CONSTANT } from "../config/constants";
   ```

### New Component

1. Create: `src/components/NewComponent.jsx`
2. Wrap with `React.memo()`
3. Export with `displayName`
4. Import and use

## 📊 Troubleshooting

### "Module not found" Error

- Check file path is relative: `../config/constants`
- Check file extension: `.js` or `.jsx`
- Check import matches export

### Hook not working

- Make sure it's called at component level (not in callbacks)
- Check import path is correct
- Verify dependencies array if using useEffect

### Form not submitting

- Check form validation rules
- Check `onFinish` handler is defined
- Verify form is wrapped with `<Form>`

### Infinite render loop

- Check useEffect dependencies
- Check for state updates in render
- Check for missing keys in lists

## 🔗 Related Files

- [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) - Detailed refactoring info
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing and debugging
- [config/constants.js](./src/config/constants.js) - All constants
- [hooks/](./src/hooks/) - All custom hooks
- [components/](./src/components/) - All reusable components

---

**Pro Tip**: Bookmark this file for quick reference while developing!

Last Updated: March 4, 2026

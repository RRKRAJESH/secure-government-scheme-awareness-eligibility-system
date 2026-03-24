# Frontend Testing & Debugging Guide

## 🧪 Testing Your Refactored Frontend

### 1. **Local Development Setup**

```bash
cd front_end/login-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open: `http://localhost:5173`

### 2. **Common Issues & Solutions**

#### Issue: "Cannot find module 'config/constants'"

**Solution**: Make sure all imports use relative paths:

```javascript
// ✅ Correct
import { ROUTES } from "../config/constants";

// ❌ Wrong
import { ROUTES } from "config/constants";
```

#### Issue: "useAuth is not a hook"

**Solution**: Import correctly:

```javascript
// ✅ Correct
import { useAuth } from "../hooks/useAuth";
import useApi from "../hooks/useApi";

// ❌ Wrong
import useAuth from "../hooks/useAuth";
```

#### Issue: Form fields not clearing after submission

**Solution**: Add explicit form reset:

```javascript
const handleFinish = (values) => {
  onSubmit(values);
  form.resetFields(); // Add this
};
```

### 3. **Performance Testing**

#### Check for Re-renders

In Chrome DevTools:

1. Go to React DevTools → Profiler
2. Click record → interact with app → stop
3. Look for yellow components (unnecessary re-renders)

**Expected**: Only components with changed props should highlight

#### Check useCallback Effectiveness

```javascript
// ✅ Good - stable function reference
const handleClick = useCallback(() => {
  setActive(id);
}, [id]);

// ❌ Bad - function re-created every render
const handleClick = () => {
  setActive(id);
};
```

### 4. **Testing Checklist**

#### Authentication Flow

```
Login Page
  ├─ [ ] Switch between USER/ADMIN
  ├─ [ ] Submit with valid credentials
  ├─ [ ] Show error for invalid credentials
  └─ [ ] Redirect to /home or /admin

Signup Page
  ├─ [ ] Username validation
  ├─ [ ] Password validation
  ├─ [ ] Confirm password validation
  └─ [ ] Success redirect to login

Login → Home → Dashboard
  ├─ [ ] Profile completion shows
  ├─ [ ] Update Profile button works
  └─ [ ] Logout clears localStorage
```

#### Profile Update Flow

```
Update Profile
  ├─ [ ] Step 1 (Basic) saves and continues
  ├─ [ ] Step 2 (Communication) saves and continues
  ├─ [ ] Step 3 (Education) handles toggle correctly
  ├─ [ ] Step 4 (Beneficiary) handles farmer toggle
  ├─ [ ] Previous button works
  └─ [ ] Submit button completes profile
```

#### Dashboard

```
Dashboard
  ├─ [ ] Menu items switch content
  ├─ [ ] Search tab shows search component
  ├─ [ ] Categories tab shows content
  ├─ [ ] Notifications tab shows content
  ├─ [ ] Profile tab shows content
  └─ [ ] Logout button clears auth
```

### 5. **Console Warnings to Check**

✅ **Good - No warnings about:**

- Missing dependencies in useEffect
- Memory leaks in useEffect
- Uncontrolled inputs

❌ **Bad - Look for:**

```
Warning: Can't perform a React state update on an unmounted component
Warning: Missing dependency in useCallback dependency array
Warning: Each child in a list should have a unique key prop
```

### 6. **Developer Tools Commands**

#### Check Auth State

```javascript
// In console:
localStorage.getItem("access_token");
localStorage.getItem("role");
```

#### Test API Endpoints

```javascript
// In console:
fetch("http://localhost:4545/api/v1/backend/profile/current-status", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
})
  .then((r) => r.json())
  .then((d) => console.log(d));
```

#### Test Hook Manually

```javascript
// In any component:
import { useAuth } from "../hooks/useAuth";

const Auth = () => {
  const { getToken, getRole } = useAuth();
  console.log("Token:", getToken());
  console.log("Role:", getRole());
  return null;
};
```

### 7. **Debugging Infinite Renders**

#### Problem: Component keeps re-rendering

**Steps to debug:**

```javascript
function MyComponent() {
  // Add this to see render count
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    renderCount.current++;
    console.log("Render #", renderCount.current);
  });

  return <div>Render count: {renderCount.current}</div>;
}
```

#### Common Causes:

1. **State update in render**

   ```javascript
   // ❌ Bad - causes infinite loop
   function Component() {
     const [count, setCount] = useState(0);
     setCount(count + 1); // Updates state in render!
     return <div>{count}</div>;
   }
   ```

2. **Missing dependencies**

   ```javascript
   // ❌ Bad - refetch runs every render
   useEffect(() => {
     fetchData();
   }); // Missing dependency array!
   ```

3. **Object/Array as dependency**
   ```javascript
   // ❌ Bad - creates new object every render
   const config = { url: "api/data" };
   useEffect(() => {
     fetchData(config);
   }, [config]); // config changes every render!
   ```

### 8. **Testing API Integration**

#### Mock API Response

```javascript
// Create a test file
const mockProfileData = {
  status_info: {
    basic_info: null,
    communication_info: null,
    education_info: null,
    beneficiary_info: null,
  },
};

// Test in console:
JSON.parse(JSON.stringify(mockProfileData));
```

#### Verify Hook Behavior

```javascript
// Test useProfileStatus hook
import useProfileStatus from "../hooks/useProfileStatus";

function TestHook() {
  const { profileData, loading, error } = useProfileStatus();

  return (
    <div>
      <p>Loading: {loading.toString()}</p>
      <p>Error: {error}</p>
      <pre>{JSON.stringify(profileData, null, 2)}</pre>
    </div>
  );
}
```

### 9. **Network Testing**

#### Check API Calls in Network Tab

1. Open DevTools → Network
2. Filter: XHR/Fetch
3. Click on request and check:
   - **Headers**: Authorization header present?
   - **Response**: Valid JSON?
   - **Status**: 200/201 or error?

#### Sample Network Check

```
Request URL: http://localhost:4545/api/v1/backend/auth/login
Method: POST
Status: 200 ✓

Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json

Response:
  {
    "data": {
      "access_token": "eyJhbGc...",
      "user": { "id": 1, "username": "test" }
    }
  }
```

### 10. **Build Testing**

```bash
# Test production build
npm run build

# Check bundle size
ls -lh dist/

# Preview production build
npm run preview
```

**Expected bundle size:** < 500KB for main bundle

### 11. **Accessibility Testing**

Use Lighthouse in DevTools:

1. F12 → Lighthouse
2. Run report
3. Check Accessibility score

**Should check:**

- [ ] Color contrast is sufficient
- [ ] Form labels are proper
- [ ] Buttons have accessible names
- [ ] Navigation is keyboard accessible

### 12. **Stress Testing Worst Case**

```javascript
// Test with slow network
// DevTools → Network → Throttle to "Slow 3G"

// Test with large profile
// Submit all 4 profile steps quickly

// Test with rapid navigation
// Click dashboard tabs rapidly
```

### 13. **Security Testing**

```javascript
// Check for XSS vulnerabilities
// In console:
localStorage.getItem("access_token");
// Should not contain user input directly

// Test logout completely clears auth
// 1. Login
// 2. Check localStorage has token
localStorage.getItem("access_token"); // Should exist

// 3. Click logout
// 4. Check localStorage is cleared
localStorage.getItem("access_token"); // Should be null
```

### 14. **Browser Compatibility**

Test on:

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Known issues:**

- None currently documented

### 15. **Git Testing Before Commit**

```bash
# Check for syntax errors
npm run lint

# Test if build works
npm run build

# Run type checking (if available)
# npm run type-check
```

---

## 🚨 Emergency Debugging

If something breaks:

1. **Clear browsercache & storage:**

   ```bash
   # In DevTools console:
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. **Check backend is running:**

   ```bash
   curl http://localhost:4545/api/v1/backend/health
   ```

3. **Enable debug logging:**

   ```javascript
   // In useApi.js - uncomment:
   console.log("API Request:", url, method);
   console.log("API Response:", data);
   ```

4. **Isolate the problem:**
   - Test one page at a time
   - Comment out features one by one
   - Use console.log() strategically

5. **Reset to working state:**
   ```bash
   git status
   git checkout -- src/
   npm install
   npm run dev
   ```

---

**Last Updated**: March 4, 2026

# Plan to Implement Merchant Dashboard Button and Add Restaurant Feature

This plan outlines the steps to add a conditional button to the user's profile page, linking to the merchant dashboard, and to implement a new feature for adding restaurants.

## 1. Implement Merchant Dashboard Button in User Profile

**Objective:** Add a button to the user profile page that only appears if the logged-in user has the "merchant" role, and links to the merchant dashboard.

**Steps:**

*   **1.1. Read `frontend/app/profile/page.tsx`:**
    *   **Status:** Completed
    *   **Details:** The file has been read to understand its structure and identify the appropriate location for the new button.
*   **1.2. Add Conditional Button:**
    *   **Status:** Completed (requires Code mode)
    *   **Details:** A `<Link>` component wrapping a `<button>` will be added within the "Micro CTAs" section (around line 177) of `frontend/app/profile/page.tsx`. This button will be rendered only if `user?.role === "merchant"` (using the `useAuth()` hook) and will navigate to `/merchant`.

## 2. Implement "Add Restaurant" Feature

**Objective:** Provide a user interface and backend integration to allow merchant users to add new restaurant profiles to the system.

**Steps:**

*   **2.1. Create Frontend Page/Component for Adding Restaurant:**
    *   **Status:** Pending
    *   **Details:** Create a new page, for example, `frontend/app/merchant/add-restaurant/page.tsx`, or a modal/drawer component. This will house the form for adding a new restaurant.
*   **2.2. Design Restaurant Creation Form:**
    *   **Status:** Pending
    *   **Details:** The form will include input fields for:
        *   `name` (Tên quán)
        *   `address` (Địa chỉ)
        *   `category` (Danh mục, e.g., "Món ăn Việt", "Cafe")
        *   `latitude` (Vĩ độ)
        *   `longitude` (Kinh độ)
        *   `description` (Mô tả)
    *   Consider adding client-side validation for required fields and data types.
    *   **Mermaid Diagram: Form Structure**
        ```mermaid
graph TD
    A[Add New Restaurant Form] --> B(Name Input)
    A --> C(Address Input)
    A --> D(Category Selector)
    A --> E(Latitude Input)
    A --> F(Longitude Input)
    A --> G(Description Textarea)
    A --> H[Submit Button]
        ```
*   **2.3. Integrate `useAuth()` for Token:**
    *   **Status:** Pending
    *   **Details:** The `useAuth()` hook will be used within the new restaurant creation component to retrieve the authentication token, which is required for making authenticated API calls to the backend.
*   **2.4. Create `createMerchant` Service Function:**
    *   **Status:** Pending
    *   **Details:** Add a new asynchronous function `createMerchant` to `frontend/lib/services/merchant.ts`. This function will take the restaurant data as input and make a `POST` request to the backend endpoint `/api/merchant/`.
    *   It will include error handling and return the response from the backend.
    *   **Mermaid Diagram: Frontend-Backend Interaction**
        ```mermaid
sequenceDiagram
    Actor Frontend
    Frontend->>+Backend: POST /api/merchant/ (with token and data)
    Backend->>+Backend: Authenticate User (RoleChecker)
    Backend->>Backend: Validate Data
    Backend->>Backend: Create Merchant in DB
    Backend-->>-Frontend: Success/Error Response
        ```
*   **2.5. Implement Form Submission Logic:**
    *   **Status:** Pending
    *   **Details:** Implement the `handleSubmit` function for the form, which will:
        *   Gather data from the input fields.
        *   Call the `createMerchant` service function.
        *   Handle loading states (e.g., disable button, show spinner).
        *   Display success messages or error feedback to the user.
        *   Redirect the user upon successful creation (e.g., to the merchant dashboard or the newly created merchant's profile page).
*   **2.6. Add Navigation to "Add Restaurant" Feature:**
    *   **Status:** Pending
    *   **Details:** Add a link or button, likely within the merchant dashboard (`/merchant`), that navigates to the new "Add Restaurant" page/component.

## 3. Update `frontend/lib/services/merchant.ts` with `createMerchant` function

**Objective:** Add the necessary service function to handle the API call for creating a new merchant.

**Steps:**

*   **3.1. Add `createMerchant` function:**
    *   **Status:** Pending
    *   **Details:** This step is covered in detail under "2.4. Create `createMerchant` Service Function" above.
<template>
  <div class="create-page">

    <div class="container">

      <h2>Create Account</h2>

      <form @submit.prevent="createAccount">

        <div class="row two">

          <div class="field">
            <label>Username</label>

            <input
              v-model="username"
              type="text"
              required
            />
          </div>

          <div class="field">
            <label>Password</label>

            <input
              v-model="password"
              type="password"
              required
            />
          </div>

        </div>

        <div class="actions">

          <router-link
            to="/"
            class="btn cancel"
          >
            Cancel
          </router-link>

          <button
            class="btn submit"
            type="submit"
          >
            Create Account
          </button>

        </div>

      </form>
    </div>

    <!-- ========================= -->
    <!-- ROLE POPUP -->
    <!-- ========================= -->

    <div
      v-if="showRolePopup"
      class="modal-overlay"
    >
      <div class="modal">

        <h3>Select Role</h3>

        <select v-model="selectedRole">

          <option disabled value="">
            Select Role
          </option>

          <option value="STAKEHOLDER">
            STAKEHOLDER
          </option>

          <option value="TREASURER">
            TREASURER
          </option>

          <option value="ENDORSING_OFFICE">
            ENDORSING OFFICE
          </option>

          <option value="BPLO_OFFICE">
            BPLO OFFICE
          </option>

          <option value="MARKETSUPERVISOR">
            MARKET SUPERVISOR
          </option>

        </select>

        <div class="modal-actions">

          <button
            class="btn cancel"
            @click="closePopup"
          >
            Cancel
          </button>

          <button
            class="btn submit"
            @click="saveRole"
          >
            Save Role
          </button>

        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')

const showRolePopup = ref(false)
const selectedRole = ref('')
const createdUserId = ref(null)

// =========================
// CREATE ACCOUNT
// =========================

async function createAccount() {

  try {

    const response =
      await fetch(
        "http://localhost:8083/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            username:
              username.value,

            password:
              password.value
          })
        }
      )

    const data =
      await response.json()

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Registration failed"
      )
    }

    // SAVE USER ID
    createdUserId.value =
      data.id

    // OPEN ROLE POPUP
    showRolePopup.value =
      true

  } catch (error) {

    console.error(error)

    alert(
      error.message
    )
  }
}

// =========================
// SAVE ROLE
// =========================

async function saveRole() {

  try {

    if (!selectedRole.value) {

      alert(
        "Please select role"
      )

      return
    }

    const response =
      await fetch(
        `http://localhost:8083/api/auth/update-role/${createdUserId.value}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            role:
              selectedRole.value
          })
        }
      )

    const text =
      await response.text()

    if (!response.ok) {

      throw new Error(
        text ||
        "Failed to save role"
      )
    }

    alert(
      "Account created successfully!"
    )

    showRolePopup.value =
      false

    // SAVE USER DATA
    localStorage.setItem(
      "userId",
      createdUserId.value
    )

    localStorage.setItem(
      "role",
      selectedRole.value
    )

    // =========================
    // REDIRECT
    // =========================

    router.push(
      "/login"
    )

  } catch (error) {

    console.error(error)

    alert(
      error.message
    )
  }
}

// =========================
// CLOSE POPUP
// =========================

function closePopup() {

  showRolePopup.value =
    false
}
</script>

<style scoped>

.create-page {
  padding: 40px;
  background: #f5f7fb;
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: auto;
  background: white;
  padding: 40px;
  border-radius: 12px;
}

.row.two {
  display: flex;
  gap: 20px;
}

.field {
  flex: 1;
  margin-bottom: 20px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.field input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.cancel {
  background: #e5e7eb;
}

.submit {
  background: #2563eb;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,.4);

  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  width: 400px;
  padding: 30px;
  border-radius: 12px;
}

.modal h3 {
  margin-bottom: 20px;
}

.modal select {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

</style>

  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'Register',
    data() {
      return {
        user: {
          email: '',
          password: ''
        },
        errorMessage: '',
        successMessage: ''
      };
    },
    methods: {
      async registerUser() {
        this.errorMessage = '';
        this.successMessage = '';
        try {
          const response = await axios.post('http://localhost:3000/register', this.user);
          this.successMessage = response.data.message;
           this.$router.push('/');
        } catch (error) {
          this.errorMessage = error.response ? error.response.data.message : 'Registration failed. Please try again later.';
        }
      }
    }
  }
  </script>
<template>
    <div class="container mt-5">
      <h1>Register Here</h1>
      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
      <form @submit.prevent="registerUser" class="w-300 mx-auto">
        <div class="mb-3">
          <label for="email" class="form-label">Email:</label>
          <input v-model="user.email" type="email" id="email" class="form-control" required>
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Password:</label>
          <input v-model="user.password" type="password" id="password" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary">Register</button>
      </form>
      <p class="mt-3">
      Back to Login <router-link to="/">Login</router-link>.
    </p>
    </div>
  </template>

  
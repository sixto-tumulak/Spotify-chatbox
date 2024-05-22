<script>
import axios from 'axios';

export default {
  name: 'Login',
  data() {
    return {
      user: {
        email: '',
        password: ''
      },
      errorMessage: '' 
    };
  },
  methods: {
    async loginUser() {
      this.errorMessage = ''; 
      try {
        const response = await axios.post('http://localhost:3000/login', this.user);
        console.log('Token:', response.data.token);
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userEmail', response.data.email);
        this.$router.push('/dashboard');
      } catch (error) {
        this.errorMessage = error.response ? error.response.data.error : 'Login failed. Please try again later.';
      }
    }
  }
}
</script>

<template>
  
  <div class="container mt-5">
    <h1>Let's talk about your song <br> with friends</h1>
    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>
    <form @submit.prevent="loginUser" class="w-50 mx-auto">
      <div class="mb-3">
        <label for="email" class="form-label">Email:</label>
        <input v-model="user.email" type="email" id="email" class="form-control" required>
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password:</label>
        <input v-model="user.password" type="password" id="password" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-primary">Login</button>
    </form>
     <p class="mt-3">
      Don't have an account? <router-link to="/register">Register here</router-link>.
    </p>
  </div>
  
</template>



<script>

import Login from './components/login.vue'
import Dashboard from './components/dashboard.vue';

export default {
  name:'App',
  components: {
    Login,
    Dashboard
  }
}
</script>

<template>
<div id="app">
<router-view></router-view>
</div>
 
</template>

<style scoped>

</style>

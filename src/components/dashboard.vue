<script>
import {jwtDecode} from "jwt-decode";
import io from "socket.io-client";

export default {
  name: "Dashboard",
  data() {
    return {
      userEmail: "",
      ws: null,
      messages: [],
      newMessage: "",
      searchQuery: "",
      searchResults: [],
      searchType: "track",
      featuredPlaylists: [],
      socket: null,
    };
  },
  mounted() {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        this.userEmail = decoded.email;
        this.setUpWebSocket();
      } catch (error) {
        console.error("Error Decoding Token:", error);
      }
    } else {
      console.error("No token found in localStorage");
    }
  },
  created() {
    this.fetchFeaturedPlaylists();
    this.fetchMessages();
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
  setUpWebSocket() {
    this.socket = io("http://localhost:3001");
    this.socket.on("message", (message) => {
      const newMessage = JSON.parse(message);
      this.messages.push({
        email: newMessage.email,
        text: newMessage.text,
        song: newMessage.song || null,
      });
    });
  },
  async logout() {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        const response = await fetch("http://localhost:3000/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error("Failed to log out");
        }

        localStorage.removeItem("authToken");
        this.userEmail = "";
        this.$router.push("/");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  },
  async fetchMessages() {
    try {
      const response = await fetch("http://localhost:3001/api/getmessages");
      const data = await response.json();
      this.messages = data;
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  },
  sendMessage() {
  const messageText = this.newMessage.trim();
  if (!messageText) {
    console.error("Message text is empty or invalid");
    return;
  }

  const message = {
    email: this.userEmail,
    text: messageText,
    song: null,
  };

 
  fetch("http://localhost:3001/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
    body: JSON.stringify(message),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Server response indicates failure to save the message");
      }
      return response.json();
    })
    .then((data) => {
      if (data.message === "Message saved") {
        this.newMessage = "";
      } else {
        console.error("Unexpected response from server:", data);
      }
    })
    .catch((error) => {
      console.error("Error sending a message:", error);
    });
},async searchSpotify() {
    if (!this.searchQuery.trim()) return;

    const url = `http://localhost:3002/search?query=${encodeURIComponent(
      this.searchQuery
    )}&type=${this.searchType}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        this.searchResults = data[this.searchType + "s"].items;
      } else {
        throw new Error("Failed to fetch search results");
      }
    } catch (error) {
      console.error("Error fetching Spotify data:", error);
      this.searchResults = [];
    }
  },
  async fetchFeaturedPlaylists() {
    try {
      const response = await fetch("http://localhost:3002/featuredPlaylists");
      if (!response.ok) {
        throw new Error(`Failed to fetch featured playlists: ${response.statusText}`);
      }
      const data = await response.json();
      this.featuredPlaylists = data.playlists.items.slice(0, 3);
    } catch (error) {
      console.error(error);
      this.featuredPlaylists = [];
    }
  },
  shareSong(song) {
  const iframeString = `<iframe src="https://open.spotify.com/embed/track/${song.id}?utm_source=generator" width="100%" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  const messageText = `Shared song: ${song.name} by ${song.artists[0].name}<br>${iframeString}`;
  this.newMessage = messageText;
  this.sendMessage();
}


},
};
</script>

<template>
  <div class="container-fluid">
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <span class="navbar-brand mb-0 h1">Dashboard</span>
        <span class="navbar-text">
          Logged in as: {{ userEmail }}
          <button class="btn btn-danger" @click="logout">Logout</button>
        </span>
      </div>
    </nav>

    <div class="row mt-3">
      <div class="col-md-4">
        <div class="chat-container card">
          <ul class="list-group list-group-flush chat-messages">
            <li
              class="list-group-item message-box"
              v-for="(message, index) in messages"
              :key="index"
              :class="{'my-message': message.email === userEmail, 'other-message': message.email !== userEmail}"
            >
              <div class="message-header">
                <strong>{{ message.email }}</strong>
              </div>
              <div class="message-body" v-html="message.text">
               
              </div>
            </li>
          </ul>
          <div class="card-footer">
            <input
              class="form-control"
              v-model="newMessage"
              @keyup.enter="sendMessage"
              placeholder="Type a message..."
            />
            <button class="btn btn-primary mt-2" @click="sendMessage">Send</button>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <h1>Welcome to Talk my Favorite</h1>
        <div class="search-section mt-4">
          <input
            class="form-control"
            v-model="searchQuery"
            @keyup.enter="searchSpotify"
            placeholder="Search Spotify..."
          />
          <select class="form-select mt-2" v-model="searchType">
            <option value="track">Tracks</option>
            <option value="playlist">Playlists</option>
            <option value="album">Albums</option>
            <option value="artist">Artists</option>
          </select>
          <button class="btn btn-success mt-2" @click="searchSpotify">Search</button>
          <ul class="list-group mt-2">
            <li class="list-group-item" v-for="(item, index) in searchResults" :key="index">
              {{ item.name }} by {{ item.artists[0].name }}
              <div v-if="searchType === 'track' && item.external_urls.spotify">
                <iframe
                  :src="`https://open.spotify.com/embed/track/${item.id}?utm_source=generator`"
                  width="100%"
                  height="80"
                  frameborder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                ></iframe>
              </div>
              <button class="btn btn-outline-primary mt-2" @click="shareSong(item)">Share Song</button>
            </li>
          </ul>
        </div>
        <div class="featured-playlists">
          <div class="card playlist-card" v-for="(playlist, index) in featuredPlaylists" :key="index">
            <div class="card-body">
              <div v-if="playlist.external_urls.spotify">
                <iframe
                  :src="`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator`"
                  frameborder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-messages {
  overflow-y: auto;
  flex-grow: 1;
}

.message-box {
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #033a10;
}

.message-box.my-message {
  background-color: #d1ffd1;
  align-self: flex-end;
}

.message-box.other-message {
  background-color: #f1f1f1;
  align-self: flex-start;
}

.message-header {
  font-weight: bold;
  margin-bottom: 5px;
}

.message-body {
  display: flex;
  flex-direction: column;
}

.song-container {
  margin-top: 10px;
}

.featured-playlists .playlist-card {
  width: 100%;
  margin-bottom: 10px;
}

iframe {
  border-radius: 12px;
}
</style>


const express = require('express');
const axios = require('axios');
const qs = require('qs');
const app = express();
const port = 3002;
const cors = require('cors')

const clientId = 'b169bce8c6c1480c89a3b6744789c5ed';
const clientSecret = '7ac47cd48bbb4a41a7b53185eca31567';
app.use(cors())
app.listen(port, () => {
    console.log(`Server is running from http://localhost:${port}`);
});

async function getSpotifyAccessToken() {
    const tokenResponse = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: qs.stringify({ grant_type: 'client_credentials' }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        }
    });
    return tokenResponse.data.access_token;
}

app.get('/featuredPlaylists', async (req, res) => {
    try {
        const accessToken = await getSpotifyAccessToken();
        const response = await axios.get('https://api.spotify.com/v1/browse/featured-playlists', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching featured playlists:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.get('/getToken', async (req, res) => {
    try {
        const accessToken = await getSpotifyAccessToken();
        res.json({ accessToken });
    } catch (error) {
        console.log('Error fetching from Spotify:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});
app.get('/search', async (req, res) => {
    const { query, type } = req.query; // e.g., query='beatles', type='track'
    if (!query || !type) {
        return res.status(400).json({ error: 'Query and type parameters are required' });
    }
    try {
        const accessToken = await getSpotifyAccessToken();
        const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                q: query,
                type: type,
                limit: 20
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error performing search on Spotify:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
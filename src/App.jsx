import React, { useEffect, useState } from 'react';

const App = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('Please log into this webpage.');
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [pageInsights, setPageInsights] = useState({
    followers: null,
    engagement: null,
    impressions: null,
    reactions: null
  });
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Load the Facebook SDK asynchronously
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Initialize the Facebook SDK
    window.fbAsyncInit = function() {
      FB.init({
        appId: 'APP_ID',
        cookie: true,
        xfbml: true,
        version: 'v10.0'
      });

      // Check login status on page load
      FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
      });
    };

    // Make checkLoginState globally accessible
    window.checkLoginState = checkLoginState;
  }, []);

  const statusChangeCallback = (response) => {
    if (response.status === 'connected') {
      testAPI(response.authResponse.accessToken);
    } else {
      setUser(null); // Clear user data
      setStatus('Please log into this webpage.');
      setPages([]); // Clear pages
      setPageInsights({
        followers: null,
        engagement: null,
        impressions: null,
        reactions: null
      }); // Clear page insights
      setPosts([]); // Clear posts
    }
  };

  const checkLoginState = () => {
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
  };

  const testAPI = (accessToken) => {
    FB.api('/me', { fields: 'name,picture,email', access_token: accessToken }, function(response) {
      setUser(response);
      setStatus('Thanks for logging in, ' + response.name + '!');
      getManagedPages(accessToken);
    });
  };

  const getManagedPages = (accessToken) => {
    FB.api('/me/accounts', { access_token: accessToken }, function(response) {
      if (response && !response.error) {
        if (response.data.length > 0) {
          setPages(response.data);
        } else {
          console.warn('No managed pages found for this user.');
        }
      } else {
        console.error('Error fetching managed pages:', response.error);
      }
    });
  };

  const fetchPageInsights = async (pageId, accessToken) => {
    const metrics = [
      'page_impressions_unique',
      'page_fans',
      'page_actions_post_reactions_total',
    ];

    const insightsUrl = `https://graph.facebook.com/v10.0/${pageId}/insights?metric=${metrics.join(',')}&access_token=${accessToken}`;

    try {
      const response = await fetch(insightsUrl);
      const data = await response.json();

      if (response.ok) {
        const updatedInsights = {
          impressions: null,
          followers: null,
          engagement: null,
          reactions: null
        };

        data.data.forEach(metric => {
          switch (metric.name) {
            case 'page_impressions_unique':
              if (metric.values.length > 0) {
                updatedInsights.impressions = metric.values[0].value;
              }
              break;
            case 'page_fans':
              if (metric.values.length > 0) {
                updatedInsights.followers = metric.values[0].value;
              }
              break;
            case 'page_actions_post_reactions_total':
              if (metric.values.length > 0 && typeof metric.values[0].value === 'number') {
                updatedInsights.reactions = metric.values[0].value;
              } else {
                console.warn('Unexpected value format for page_actions_post_reactions_total:', metric.values);
                updatedInsights.reactions = 0;
              }
              break;
            default:
              console.warn('Unhandled metric:', metric);
              break;
          }
        });

        updatedInsights.engagement = 0;
        setPageInsights(updatedInsights);

      } else {
        console.error('Error fetching page insights:', data.error);
        // Handle specific errors or show a generic error message
      }
    } catch (error) {
      console.error('Error fetching page insights:', error);
      // Handle network errors or unexpected exceptions
    }
  };

  const fetchPosts = (pageId, accessToken) => {
    FB.api(`/${pageId}/posts`, { fields: 'message,attachments', access_token: accessToken }, function(response) {
      if (response && !response.error) {
        setPosts(response.data);
      } else {
        console.error('Error fetching posts:', response.error);
      }
    });
  };

  const handlePageChange = (event) => {
    setSelectedPage(event.target.value);
    if (event.target.value) {
      const selectedPage = pages.find(page => page.id === event.target.value);
      if (selectedPage) {
        fetchPageInsights(selectedPage.id, selectedPage.access_token);
        fetchPosts(selectedPage.id, selectedPage.access_token);
      }
    }
  };

  const handleLogin = () => {
    FB.login(function(response) {
      if (response.authResponse) {
        checkLoginState();
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, { scope: 'public_profile,email,pages_read_engagement,pages_show_list', auth_type: 'reauthorize' });
  };

  const handleLogout = () => {
    FB.logout(function(response) {
      setStatus('Please log into this webpage.');
      setUser(null);
      setPages([]);
      setPageInsights({
        followers: null,
        engagement: null,
        impressions: null,
        reactions: null
      });
      setPosts([]);
    });
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>Add Facebook Login to your webpage</h2>
      {!user && (
        <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#4267B2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Login with Facebook
        </button>
      )}
      {user && (
        <div>
          <h1>Welcome, {user.name}</h1>
          {user.picture && user.picture.data && (
            <img src={user.picture.data.url} alt="Profile" style={{ borderRadius: '50%', width: '100px', height: '100px', objectFit: 'cover' }} />
          )}
          <button onClick={handleLogout} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#4267B2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
            Logout
          </button>
        </div>
      )}
      <div id="status" style={{ marginTop: '10px', marginBottom: '10px', fontSize: '18px' }}>{status}</div>
      {pages.length > 0 && (
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h3>Select a Page to view Insights</h3>
          <select onChange={handlePageChange} value={selectedPage} style={{ padding: '10px', fontSize: '16px' }}>
            <option value="">Select a Page</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>{page.name}</option>
            ))}
          </select>
        </div>
      )}
      {pageInsights.followers !== null && (
        <div style={{ marginTop: '20px' }}>
          <h3>Page Insights</h3>
          <div className="card" style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <h4>Total Followers / Fans</h4>
            <p>{pageInsights.followers}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <h4>Total Engagement</h4>
            <p>{pageInsights.engagement}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <h4>Total Impressions</h4>
            <p>{pageInsights.impressions}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <h4>Total Reactions</h4>
            <p>{pageInsights.reactions}</p>
          </div>
        </div>
      )}
      {posts.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Page Posts</h3>
          {posts.map(post => (
            <div key={post.id} style={{ marginBottom: '10px' }}>
              {post.attachments && post.attachments.data.length > 0 && (
                <div>
                  <h4>Attachments:</h4>
                  <ul>
                    {post.attachments.data.map((attachment, index) => (
                      <li key={index} style={{ listStyle: 'none' }}>
                        {attachment.media && attachment.media.image && (
                          <img
                            src={attachment.media.image.src}
                            alt="Attachment"
                            style={{ width: '100%', height: 'auto', marginBottom: '10px', maxWidth: '300px' }}
                          />
                        )}
                        {attachment.description && (
                          <p>{attachment.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <h4>Message:</h4>
              <p>{post.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;

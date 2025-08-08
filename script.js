const blogId = '8468974237754039765'; // আপনার ব্লগের ID এখানে দিন
const apiKey = 'AIzaSyAgZruhDU6Hyaf-nCiHN9PNgOkSzpC5Ybo'; // আপনার API Key এখানে দিন
const postsContainer = document.getElementById('posts-container');
const loadingSpinner = document.getElementById('loading-spinner');
const searchInput = document.getElementById('search-input');

let nextPageToken = null;
let allPosts = [];
let postCount = 0;

// Function to calculate how many days have passed since a date
function daysSince(date) {
    const postDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today - postDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
}

// Function to fetch posts from Blogger API
async function fetchPosts(pageToken = null) {
    loadingSpinner.style.display = 'block';
    let url = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}&maxResults=10`;
    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items) {
            nextPageToken = data.nextPageToken;
            allPosts = allPosts.concat(data.items);
            renderPosts(data.items);
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Function to render posts on the page
function renderPosts(posts) {
    posts.forEach(post => {
        postCount++;

        const postElement = document.createElement('div');
        postElement.classList.add('post-card');

        // Author details
        const author = post.author;
        const authorName = author?.displayName || 'Unknown Author';
        const authorAvatar = author?.image?.url || 'https://via.placeholder.com/40';

        // Post published date
        const daysAgo = daysSince(post.published);
        const publishedDate = new Date(post.published).toLocaleDateString();

        // Extract thumbnail from post content (first image)
        let thumbnailUrl = '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = post.content;
        const firstImage = tempDiv.querySelector('img');
        if (firstImage && firstImage.src) {
            thumbnailUrl = firstImage.src;
        }

        // Truncate post content and add 'see more' link
        const truncatedContent = post.content.length > 200 && !thumbnailUrl ? post.content.substring(0, 200) + '...' : post.content;
        const seeMoreLink = post.content.length > 200 && !thumbnailUrl ? `<a href="#" class="see-more">...See more</a>` : '';

        // Share button
        const shareUrl = `${window.location.origin}/?postid=${post.id}`; // Custom shareable link

        let postContentHtml = `<div class="post-content">${truncatedContent}${seeMoreLink}</div>`;
        if (thumbnailUrl) {
            postContentHtml = `<div class="post-thumbnail"><img src="${thumbnailUrl}" alt="Post Thumbnail"></div>` + postContentHtml;
        }
        
        // This is where you would place your most-viewed and least-viewed posts logic
        // Since Blogger API doesn't provide this data, the code below is a placeholder
        // and just renders all posts chronologically.

        postElement.innerHTML = `
            <div class="post-header">
                <img src="${authorAvatar}" alt="Author Avatar" class="author-avatar">
                <div class="author-details">
                    <p class="author-name">${authorName}</p>
                    <p class="post-date">Uploaded ${daysAgo} days ago on ${publishedDate}</p>
                </div>
            </div>
            <h2 class="post-title">${post.title}</h2>
            ${postContentHtml}
            <div class="post-actions">
                <button class="share-button" onclick="sharePost('${post.title}', '${shareUrl}')">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        `;
        postsContainer.appendChild(postElement);

        // Add 'see more' functionality
        if (seeMoreLink) {
            const seeMoreElement = postElement.querySelector('.see-more');
            if (seeMoreElement) {
                seeMoreElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    const contentDiv = e.target.parentElement;
                    contentDiv.innerHTML = post.content;
                    contentDiv.classList.add('expanded');
                });
            }
        }

        // Ad integration every 3 posts
        if (postCount % 3 === 0) {
            postsContainer.appendChild(createAdContainer());
        }
    });
}

// Function to create an ad container
function createAdContainer() {
    const adElement = document.createElement('div');
    adElement.classList.add('ad-container');
    adElement.innerHTML = `
        <div class="ad-text">Advertisement</div>
        `;
    return adElement;
}

// Share post function
function sharePost(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).then(() => {
            console.log('Thanks for sharing!');
        }).catch(console.error);
    } else {
        alert('Web Share API is not supported in this browser.');
    }
}

// Infinite scrolling logic
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && nextPageToken && loadingSpinner.style.display === 'none') {
        fetchPosts(nextPageToken);
    }
});

// Search functionality
searchInput.addEventListener('keyup', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        post.content.toLowerCase().includes(searchTerm) ||
        (post.author && post.author.displayName && post.author.displayName.toLowerCase().includes(searchTerm))
    );
    postsContainer.innerHTML = '';
    renderPosts(filteredPosts);
});

// Initial load
fetchPosts();
# ScoreManager – Performance & Repertoire System

A full-stack web application engineered to centralize live performance logistics. It acts as a unified command center for managing digital sheet music databases, high-fidelity audio backing tracks, and event scheduling, eliminating the reliance on multiple third-party apps during live stage performances.

## 🚀 Key Features

* **Repertoire & Asset Management:** Organize digital sheet music (PDFs) and high-fidelity audio accompaniments in a centralized database.
* **Smart Media Player:** Custom frontend audio player featuring a non-repeating shuffle algorithm for seamless, automated playback on stage.
* **Large Media Handling:** Optimized server architecture capable of processing stable, large-scale media uploads (up to 500MB) without timeout errors.
* **Automated Document Generation:** Dynamically format and export professional client setlists in PDF format using the `jsPDF` library.
* **Event Scheduling:** Dashboard to track upcoming gigs, locations, and call times.

## 🛠 Tech Stack

* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** MySQL (DigitalOcean Managed Database)
* **Infrastructure:** Docker, Nginx (Reverse Proxy), DigitalOcean Droplet

## ⚙️ Environment Variables

Create a `.env` file in the root directory with your database and port configurations:

    ```env
    username=your_db_username
    DB_PASSWORD=your_db_password
    host=your_managed_db_host
    port=25060
    database=your_db_name
    sslmode=REQUIRED
    PORT=3000
    
////////////////////////////////////////////////
Deployment (Docker Native)
This application is containerized for stable production deployment. Due to compatibility requirements, it is recommended to use native Docker commands rather than docker-compose.

1. Build the Docker image:

   ```bash
   docker build -t scores-violin-app .

2. Run the container:
Maps the internal port 3000 to the external port 4000 and mounts the uploads volume for persistent storage.

```bash
docker run -d \
  --name gig-app \
  -p 4000:3000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  --restart unless-stopped \
  scores-violin-app
```

🌐 Nginx Configuration
To expose the application to the web securely, configure Nginx as a reverse proxy pointing to port 4000:

Nginx
```bash
server {
    server_name scores.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Extended timeouts for large media uploads
        client_max_body_size 500M;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

👨‍💻 Author
Martin Munoz
Full-Stack Developer & Musician
Portfolio: martinviolin.com | martinotin24.dev


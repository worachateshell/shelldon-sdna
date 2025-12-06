# Wedding Game & Upload Slip

A modern, interactive wedding website featuring LINE Login, Digital Envelopes, and a Lucky Draw game. Built with Node.js, Express, and Google Cloud integrations.

## ✨ Features

- **LINE Login Integration**: Easy guest registration and authentication using LINE accounts.
- **Digital Envelope**: Guests can send wishes and attach bank transfer slips.
- **Google Drive Integration**: Automatically uploads transfer slips to a secure Google Drive folder.
- **Google Sheets Sync**: Real-time synchronization of guest data and wishes to Google Sheets.
- **Lucky Draw Game**: Interactive random name picker for wedding games.
- **QR Code Generation**: Dynamic QR code generation for payments or links.
- **Responsive Design**: "Cool Black" themed UI that looks great on mobile and desktop.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database/Storage**: Google Sheets (Data), Google Drive (Images)
- **Authentication**: LINE Login API
- **Libraries**: `googleapis`, `multer`, `qrcode`, `axios`

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Google Cloud Platform Project with Sheets and Drive APIs enabled.
- LINE Developers Channel (for LINE Login).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/wedding-game.git
    cd wedding-game
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configuration**
    Create a `.env` file in the root directory based on the following template:

    ```env
    # Google Configuration
    GOOGLE_SHEET_ID=your_sheet_id
    GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
    GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

    # LINE Login Configuration
    LINE_CHANNEL_ID=your_channel_id
    LINE_CHANNEL_SECRET=your_channel_secret
    LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback

    # Session Security
    SESSION_SECRET=your_random_secret_string
    ```

4.  **Google Credentials**
    Place your Google Service Account `credentials.json` file in the root directory.
    *Note: Ensure the Service Account has Editor access to your Google Sheet and Drive Folder.*

### Running the Application

```bash
npm start
```

The server will start at `http://localhost:3000`.

## 📂 Project Structure

```
├── .env                    # Environment variables
├── credentials.json        # Google Service Account Key (Ignored by Git)
├── server.js               # Main application server
├── public/                 # Static assets
│   ├── index.html          # Main landing page
│   ├── register.html       # Registration page
│   ├── e-envelope.html     # Digital envelope page
│   ├── luckydraw.js        # Game logic
│   └── style.css           # Global styles
└── uploads/                # Temporary upload directory
```

## 🌐 Deployment

### Cloudflare Tunnel (Recommended)

Deploy your application securely with Cloudflare Tunnel:

```bash
./start-tunnel.sh
```

For detailed setup instructions, see [CLOUDFLARE_TUNNEL.md](CLOUDFLARE_TUNNEL.md).

### Other Deployment Options

See [DEPLOYMENT.md](DEPLOYMENT.md) for PM2, Docker, and VPS deployment guides.

## 🔒 Security Note

This project uses a `.gitignore` file to ensure sensitive information like `.env` and `credentials.json` are not committed to the repository. **Never share your private keys.**

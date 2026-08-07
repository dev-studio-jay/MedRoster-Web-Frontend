import "./globals.css";
import { FirebaseAuthProvider } from '../components/FirebaseAuthProvider';

export const metadata = {
  title: "MedRoster — Ghana Hospital Staff Scheduling",
  description: "Duty roster management built for Ghana Health Service facilities",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
      </body>
    </html>
  );
}

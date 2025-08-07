import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import db from '../DB/dbconfig.js';

// Function to hash passwords
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Generate random date within the past year
const randomDate = () => {
  const now = new Date();
  const pastYear = new Date(now.setMonth(now.getMonth() - Math.floor(Math.random() * 12)));
  return pastYear;
};

// Generate expiration date in the future (for premium plans)
const futureDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Generate realistic names
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia', 
  'Robert', 'Sophia', 'William', 'Ava', 'Joseph', 'Mia', 'Thomas', 'Isabella',
  'Raj', 'Priya', 'Amit', 'Neha', 'Vikram', 'Meera', 'Anand', 'Divya'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
  'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Patel', 'Singh', 'Kumar', 'Sharma', 'Gupta', 'Shah', 'Verma', 'Mehta'
];

// Generate random user data
const generateRandomUser = async (index) => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const email = `user${index}@example.com`;
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}`;
  
  // Randomize attributes
  const plans = ['FREE', 'SILVER', 'GOLD', 'PREMIUM'];
  const plan = plans[Math.floor(Math.random() * plans.length)];
  
  const isActive = Math.random() > 0.2; // 80% active
  const roles = ['user', 'admin'];
  const role = index < 5 ? (Math.random() > 0.8 ? 'admin' : 'user') : 'user'; // First 5 users have higher chance to be admin
  
  // Generate plan expiration date for premium plans
  let planExpiresAt = null;
  if (plan !== 'FREE') {
    planExpiresAt = futureDate(Math.floor(Math.random() * 90) + 1); // 1-90 days
  }
  
  return {
    uuid: uuidv4(),
    name,
    email,
    username,
    password: await hashPassword('password123'), // Same password for all test users
    role,
    is_active: isActive ? 1 : 0,
    plan,
    plan_expires_at: planExpiresAt,
    created_at: randomDate(),
    next_action: null, // All test users have completed onboarding
    login_method: 'EMAIL',
    profile_picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
  };
};

// Add notifications for some users
const addNotificationsForUser = async (userUuid, count = 3) => {
  const notificationTypes = ['SYSTEM', 'PLAN', 'PAYMENT', 'PODCAST', 'PROFILE'];
  const messages = [
    'Welcome to PodcastHub!',
    'Your plan will expire soon.',
    'Your podcast has new listeners!',
    'Profile update reminder',
    'New feature available',
    'Security alert: New login',
    'Payment successful'
  ];

  for (let i = 0; i < count; i++) {
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const seen = Math.random() > 0.5 ? 1 : 0;
    
    await db.query(
      'INSERT INTO notifications (user_uuid, type, message, seen, created_at) VALUES (?, ?, ?, ?, ?)',
      [userUuid, type, message, seen, randomDate()]
    );
  }
};

// Add podcast pages for some users
const addPodcastPageForUser = async (userUuid, username) => {
  if (Math.random() > 0.7) {
    const spotifyLink = `https://open.spotify.com/show/${Math.random().toString(36).substring(2, 10)}`;
    const appleLink = `https://podcasts.apple.com/podcast/id${Math.floor(Math.random() * 1000000)}`;
    const embedCode = `<iframe src="https://open.spotify.com/embed/episode/${Math.random().toString(36).substring(2, 15)}" width="100%" height="232" frameBorder="0"></iframe>`;
    const clickCount = Math.floor(Math.random() * 1000);
    
    await db.query(
      'INSERT INTO podcast_pages (user_uuid, username, spotify_link, apple_link, embed_code, click_count) VALUES (?, ?, ?, ?, ?, ?)',
      [userUuid, username, spotifyLink, appleLink, embedCode, clickCount]
    );
  }
};

// Main function to seed data
const seedData = async () => {
  try {
    console.log('Starting to seed database with test data...');
    
    // Create test users
    const userCount = 50; // Generate 50 test users
    
    for (let i = 1; i <= userCount; i++) {
      const userData = await generateRandomUser(i);
      
      // Insert user
      await db.query(`
        INSERT INTO users (
          uuid, name, email, username, password, role, is_active, 
          plan, plan_expires_at, created_at, next_action, 
          login_method, profile_picture
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.uuid, userData.name, userData.email, userData.username, userData.password,
        userData.role, userData.is_active, userData.plan, userData.plan_expires_at,
        userData.created_at, userData.next_action, userData.login_method, userData.profile_picture
      ]);
      
      console.log(`Created user: ${userData.name} (${userData.email}) - Role: ${userData.role}`);
      
      // Add notifications for some users
      if (Math.random() > 0.5) { // 50% chance to have notifications
        const notificationCount = Math.floor(Math.random() * 5) + 1; // 1-5 notifications
        await addNotificationsForUser(userData.uuid, notificationCount);
      }
      
      // Add podcast page for some users
      await addPodcastPageForUser(userData.uuid, userData.username);
    }
    
    console.log(`✅ Successfully created ${userCount} test users`);
    console.log('Seeding completed!');
    
    // Create special admin user for easy login
    const adminPassword = await hashPassword('admin123');
    const adminUuid = uuidv4();
    
    await db.query(`
      INSERT INTO users (
        uuid, name, email, username, password, role, is_active, 
        plan, created_at, next_action, login_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, ?)
    `, [
      adminUuid, 'Admin User', 'admin@example.com', 'admin', 
      adminPassword, 'admin', 1, 'PREMIUM', 'EMAIL'
    ]);
    
    console.log('Created special admin user:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seeding function
seedData();
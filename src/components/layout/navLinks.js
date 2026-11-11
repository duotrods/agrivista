// Sidebar sections per role. Each link is [path, label, icon].
export const NAV_SECTIONS = {
  farmer: [
    { title: 'General', links: [['/', 'Dashboard', 'home'], ['/fields', 'My Fields', 'fields'], ['/my-map', 'Map', 'map'], ['/notifications', 'Notifications', 'bell']] },
    { title: 'Monitoring', links: [['/monitoring', 'Monitoring', 'chart'], ['/reports', 'Reports', 'report']] },
    { title: 'Account', links: [['/profile', 'Profile', 'user'], ['/settings', 'Settings', 'settings']] },
  ],
  lgu_staff: [
    { title: 'General', links: [['/', 'Dashboard', 'home'], ['/lgu/fields', 'Rice Fields', 'fields'], ['/lgu/map', 'Map', 'map'], ['/notifications', 'Notifications', 'bell']] },
    { title: 'Management', links: [['/lgu/verify', 'Verify Fields', 'check'], ['/lgu/users', 'Farmers', 'users'], ['/lgu/announcements', 'Announcements', 'megaphone']] },
    { title: 'Monitoring', links: [['/lgu/reports', 'Monitoring Reports', 'report'], ['/lgu/crop-monitoring', 'Crop Monitoring', 'chart'], ['/lgu/agricultural-reports', 'Agricultural Reports', 'report']] },
    { title: 'System', links: [['/lgu/activity', 'Activity Logs', 'activity'], ['/settings', 'Settings', 'settings'], ['/profile', 'Profile', 'user']] },
  ],
  admin: [
    { title: 'General', links: [['/', 'LGU Approvals', 'check'], ['/admin/users', 'Users', 'users'], ['/notifications', 'Notifications', 'bell']] },
    { title: 'Account', links: [['/profile', 'Profile', 'user'], ['/settings', 'Settings', 'settings']] },
  ],
}


// [path, label, icon] per role. Shared by the sidebar and any other nav surface.
export const NAV_LINKS = {
  farmer: [['/', 'Dashboard', 'home'], ['/fields', 'My Fields', 'fields'], ['/my-map', 'Map', 'map'], ['/monitoring', 'Monitoring', 'chart'], ['/reports', 'Reports', 'report'], ['/notifications', 'Notifications', 'bell'], ['/profile', 'Profile', 'user']],
  lgu_staff: [['/', 'Dashboard', 'home'], ['/lgu/fields', 'Rice Fields', 'fields'], ['/lgu/map', 'Map', 'map'], ['/lgu/verify', 'Verify Fields', 'check'], ['/lgu/users', 'Farmers', 'users'], ['/lgu/reports', 'Monitoring Reports', 'report'], ['/lgu/crop-monitoring', 'Crop Monitoring', 'chart'], ['/lgu/agricultural-reports', 'Agricultural Reports', 'report'], ['/notifications', 'Notifications', 'bell'], ['/lgu/activity', 'Activity Logs', 'activity'], ['/profile', 'Profile', 'user']],
  admin: [['/', 'LGU Approvals', 'check'], ['/admin/users', 'Users', 'users'], ['/notifications', 'Notifications', 'bell'], ['/profile', 'Profile', 'user']],
}

-- Remove Dashboard and Profile from permission system as they are now accessible to all users
DELETE FROM permissions WHERE code IN ('menu.dashboard', 'menu.profile');

export const testData = {
  baseURL: process.env.BASE_URL || 'https://faye-test.link',
  verificationCode: process.env.VERIFICATION_CODE || '0124',
  creator: {
    email: process.env.CREATOR_EMAIL || 'haaaaaaaa@wegrowth.dev',
    username: process.env.CREATOR_USERNAME || 'haaaaaaaa',
  },
};

/** Viewer 邮箱: UItest{MMDD}{4位随机数}@wegrowth.dev */
export function generateViewerEmail(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `UItest${mm}${dd}${random}@wegrowth.dev`;
}

export function generateViewerUsername(): string {
  return `viewer_${Date.now().toString().slice(-8)}`;
}

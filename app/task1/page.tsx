import { redirect } from 'next/navigation';

// 구 URL 호환: /task1 → /t/1
export default function Task1Redirect() {
  redirect('/t/1');
}

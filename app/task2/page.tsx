import { redirect } from 'next/navigation';

// 구 URL 호환: /task2 → /t/2
export default function Task2Redirect() {
  redirect('/t/2');
}

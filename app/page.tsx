import { redirect } from 'next/navigation';

// 과제가 독립 URL(/t/1, /t/2)로 분리됨. 루트는 과제 1로 보냄.
// (관리자 페이지는 로그인 화면에서 이름에 admin 입력)
export default function Home() {
  redirect('/t/1');
}

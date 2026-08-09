import { useState, type SubmitEvent } from "react"



function mockLoginApi(id: string, password: string): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 여기서 성공/실패 조건 판단해서 resolve 또는 reject 호출
	  if (id !== '' && password !== '')
			resolve({success:true});
	  else
			reject(new Error('아이디/비밀번호를 확인해주세요.'));
    }, 800)
  })
}

export default function LoginView() {

interface User {
  id: number;
  name: string;
  email: string;
}

const [userId, setUserId] = useState<string>('');
const [userPassword, setUserPassword] = useState<string>('');
// api 연결할 때 사용하기
// const [isLoading, setIsLoading] = useState<boolean>(false);

function handleLogin(e : SubmitEvent<HTMLFormElement>)
{
	e.preventDefault();
	mockLoginApi(userId, userPassword);
	// console.log(userId, userPassword);
}


// const fetchUser = async (userId: string): Promise<User> => {
//   const response = await fetch(`https://example.com{userId}`);
  
//   if (!response.ok) {
//     throw new Error('유저 정보를 불러오지 못했습니다.');
//   }
  
//   return response.json();
// };

// function handleSignIn() {
// 	console.log("회원가입 클릭");
// }
	return (
	  <main className="h-screen bg-gray-100 flex items-center justify-center">
		<div className='bg-white w-96 rounded-2xl px-8 py-9 border border-gray-200 flex flex-col gap-6'>
			<div className="flex flex-col items-center gap-2">
				<div className="bg-purple-500 rounded-xl w-12 h-12 flex items-center justify-center text-white text-xl">💬</div>
				<p className="font-bold text-xl text-gray-900">TaskChat</p>
				<p className="text-sm text-gray-500">아이디를 입력해 로그인하세요</p>
			</div>
			<form className="flex flex-col gap-4" onSubmit={handleLogin}>
				<div className="flex flex-col gap-1">
					<label htmlFor="login-id" className="text-xs font-medium text-gray-500">아이디</label>
					<input id="login-id" type="text" placeholder='아이디 입력' className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400" value={userId} onChange={(e) => {setUserId(e.target.value)}}/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="login-pw" className="text-xs font-medium text-gray-500">비밀번호</label>
					<input id="login-pw" type="password" placeholder='비밀번호 입력' className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400" value={userPassword} onChange={(e)=>{setUserPassword(e.target.value)}}/>
				</div>
				<button className="w-full h-10 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition-colors cursor-pointer">로그인</button>
			</form>
			<p className="text-center text-xs text-gray-400">
				계정이 없으신가요? <span className="text-purple-600 font-semibold cursor-pointer" onClick={()=>console.log('회원가입 클릭')}>회원가입</span>
			</p>
		</div>
	  </main >
	)
  }
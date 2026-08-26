# 오늘 플래너

할 일 · 메모 · 캘린더를 한 곳에서. 휴대폰에서 쓰기 좋게 만든 개인용 플래너입니다.

## 처음 한 번만 하는 설정

### 1. GitHub에 올리기
1. github.com 가입 후 로그인
2. 오른쪽 위 **+** → **New repository**
3. 이름은 아무거나 (예: `planner`), **Private** 선택해도 배포됩니다
4. **Create repository**
5. 만들어진 화면에서 **uploading an existing file** 클릭
6. 이 폴더 안의 파일을 **전부** 끌어다 놓기
   - `node_modules` 와 `dist` 폴더는 올리지 마세요 (없어도 됩니다)
7. 아래 **Commit changes**

### 2. Vercel과 연결하기
1. vercel.com 로그인 → **Add New** → **Project**
2. GitHub 계정 연결 후 방금 만든 저장소 선택
3. 설정은 건드릴 것 없이 **Deploy**
4. 1~2분 뒤 주소가 나옵니다 (예: `planner-abc.vercel.app`)

이 주소는 **앞으로 계속 같습니다.**

## 앞으로 고칠 때

1. GitHub에서 `src/Planner.jsx` 파일 클릭
2. 연필 아이콘(Edit) 누르고 내용 바꾸기
3. 아래 **Commit changes**
4. 끝. Vercel이 알아서 다시 배포합니다 (1~2분)

휴대폰 브라우저에서도 됩니다.
새 코드를 통째로 받았다면 `src/Planner.jsx` 파일만 교체하면 됩니다.

## 휴대폰 홈화면에 추가

- 아이폰: 사파리로 주소 열기 → 공유 → 홈 화면에 추가
- 안드로이드: 크롬으로 열기 → 메뉴 → 홈 화면에 추가

주소창 없이 앱처럼 열립니다.

## 기록은 어디에 저장되나요

각자의 브라우저에 저장됩니다. 서버로 가지 않습니다.

- 같은 주소를 여러 사람이 써도 서로의 목록은 보이지 않습니다
- 폰과 노트북은 각각 따로 저장됩니다 (같이 보이지 않아요)
- 브라우저 기록/캐시를 지우면 데이터도 함께 지워집니다
- 사진은 넣을 때 자동으로 줄여서 저장합니다

## 폴더 설명

```
index.html          껍데기 (건드릴 일 거의 없음)
src/Planner.jsx     앱 전체 코드 — 고칠 건 여기
src/main.jsx        시작점
public/             아이콘, manifest
package.json        필요한 라이브러리 목록
```

## 내 컴퓨터에서 미리 보고 싶다면

Node.js 설치 후:

```
npm install
npm run dev
```

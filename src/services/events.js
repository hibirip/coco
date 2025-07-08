/**
 * 이벤트 데이터 서비스
 * 현재는 하드코딩된 데이터를 제거하고 빈 배열 반환
 * 실제 이벤트 데이터는 백엔드 API나 CMS에서 가져와야 함
 */

// 이벤트 데이터 가져오기
export async function getEvents() {
  try {
    // TODO: 실제 API 엔드포인트로 교체
    // const response = await fetch('/api/events');
    // const data = await response.json();
    // return data;
    
    // 현재는 빈 배열 반환 (실제 이벤트 없음)
    return [];
  } catch (error) {
    console.error('이벤트 데이터 로드 실패:', error);
    return [];
  }
}

// 이벤트 상세 정보 가져오기
export async function getEventDetail(eventId) {
  try {
    // TODO: 실제 API 엔드포인트로 교체
    // const response = await fetch(`/api/events/${eventId}`);
    // const data = await response.json();
    // return data;
    
    return null;
  } catch (error) {
    console.error('이벤트 상세 정보 로드 실패:', error);
    return null;
  }
}
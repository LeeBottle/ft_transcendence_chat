// 여러 className 조각을 합치는 작은 도우미.
// 거짓값(false, null, undefined, '')은 걸러내고 공백으로 이어붙인다.
//   cn('a', condition && 'b', null) → condition 이 참이면 'a b', 아니면 'a'

type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter((v): v is string => typeof v === 'string' && v.length > 0).join(' ');
}

export function getCookie (name) {
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const prefix = `${encodeURIComponent(name)}=`
  const cookie = cookies.find(cookie => cookie.startsWith(prefix))

  if (!cookie) return

  const value = cookie.split('=').slice(1).join('=')
  return value ? decodeURIComponent(value) : undefined
}

export async function runTask(path: string, data: any, key: string) {
  const f = await fetch('https://api.stability.ai/v2beta/stable-image/' + path, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Accept': 'image/*'
    },
    body: data
  });

  return f
}

const jobUrl = "https://mango.sievedata.com/v2/jobs/";
const pushUrl = "https://mango.sievedata.com/v2/push";

export async function postJob(input: object, key: string) {
  const response = await fetch(pushUrl, {
    method: 'POST',
    headers: {
      "X-API-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json<{ id: string }>();
  return data.id;
}

export async function getJob(id: string, key: string) {
  const response = await fetch(jobUrl + id, {
    headers: { "X-API-Key": key }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const json = await response.json<{ status: string, outputs: any }>();
  return {
    status: json.status,
    result: json.outputs,
  };
}

'use server'

export async function testServerAction(): Promise<string> {
  console.log('Server Action called')
  return 'Server Actionが正常に動作しています！'
}
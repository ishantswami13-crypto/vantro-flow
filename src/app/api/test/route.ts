export const dynamic = 'force-dynamic'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  return Response.json({
    hasDbUrl: !!dbUrl,
    dbUrlLength: dbUrl?.length,
    dbUrlStart: dbUrl?.substring(0, 30),
    dbUrlEnd: dbUrl?.substring(dbUrl.length - 30)
  })
}

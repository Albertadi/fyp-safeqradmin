import EditUser from './EditUser'; // Adjust this path based on your file structure

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { userId } = await params;
  return <EditUser userId={userId} />;
}
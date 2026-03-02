import Header from "@/components/layout/Header";
import TabBar from "@/components/layout/TabBar";
import AuthProvider from "@/components/providers/AuthProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-20">{children}</main>
        <TabBar />
      </div>
    </AuthProvider>
  );
}

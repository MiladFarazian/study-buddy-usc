
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

const Courses = () => {
  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">USC Courses</h1>
          <p className="text-muted-foreground">Browse and explore courses from all USC departments</p>
        </div>
        <div className="w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search courses..." 
              className="pl-9 w-full md:w-[300px]" 
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <div className="mb-8">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All Schools</TabsTrigger>
            <TabsTrigger value="viterbi">Viterbi Engineering</TabsTrigger>
            <TabsTrigger value="marshall">Marshall Business</TabsTrigger>
            <TabsTrigger value="dornsife">Dornsife Arts & Sciences</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Popular Courses</h2>
            <p className="text-gray-500">Course listing coming soon.</p>
            <div className="mt-4">
              <Button>Explore Courses</Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="viterbi" className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Viterbi School of Engineering</h2>
            <p className="text-gray-500">Engineering course listing coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="marshall" className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Marshall School of Business</h2>
            <p className="text-gray-500">Business course listing coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="dornsife" className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Dornsife College of Arts & Sciences</h2>
            <p className="text-gray-500">Arts & Sciences course listing coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Courses;

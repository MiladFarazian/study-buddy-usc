
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  FolderClosed, 
  Search, 
  Upload,
  FileType, 
  FileImage, 
  File 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const resources = [
  {
    id: "1",
    name: "CSCI 104 Midterm Study Guide",
    course: "CSCI 104",
    type: "pdf",
    size: "2.4 MB",
    date: "May 2, 2024",
    icon: File
  },
  {
    id: "2",
    name: "Microeconomics Practice Problems",
    course: "ECON 203",
    type: "docx",
    size: "1.2 MB",
    date: "Apr 28, 2024",
    icon: FileText
  },
  {
    id: "3",
    name: "Chemistry Lab Notes",
    course: "CHEM 105A",
    type: "pdf",
    size: "3.7 MB",
    date: "Apr 25, 2024",
    icon: File
  },
  {
    id: "4",
    name: "Calculus Formula Sheet",
    course: "MATH 125",
    type: "pdf",
    size: "0.9 MB",
    date: "Apr 20, 2024",
    icon: File
  },
  {
    id: "5",
    name: "Physics Diagrams Collection",
    course: "PHYS 151",
    type: "zip",
    size: "15.2 MB",
    date: "Apr 15, 2024",
    icon: FileImage
  }
];

const Resources = () => {
  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Study Resources</h1>
          <p className="text-muted-foreground">Access and share study materials for your courses</p>
        </div>
        <Button className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
          <Upload className="mr-2 h-4 w-4" /> Upload Resource
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Browse By</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                  <FolderClosed className="h-4 w-4 text-usc-cardinal" />
                  <span>All Resources</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                  <FolderClosed className="h-4 w-4 text-usc-cardinal" />
                  <span>My Uploads</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                  <FolderClosed className="h-4 w-4 text-usc-cardinal" />
                  <span>Bookmarked</span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Popular Courses</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <FolderClosed className="h-4 w-4 text-usc-cardinal" />
                    <span>CSCI 104</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <FolderClosed className="h-4 w-4 text-usc-cardinal" />
                    <span>ECON 203</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <FolderClosed className="h-4 w-4 text-usc-cardinal" />
                    <span>MATH 125</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <FolderClosed className="h-4 w-4 text-usc-cardinal" />
                    <span>CHEM 105A</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <CardTitle>Study Materials</CardTitle>
                <div className="relative w-full md:w-[300px] mt-2 md:mt-0">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search resources..." 
                    className="pl-9" 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="practice">Practice Problems</TabsTrigger>
                  <TabsTrigger value="study-guides">Study Guides</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground px-4 py-2 border-b">
                      <div className="col-span-6">Name</div>
                      <div className="col-span-2">Course</div>
                      <div className="col-span-2">Size</div>
                      <div className="col-span-2">Date</div>
                    </div>

                    {resources.map((resource) => (
                      <div 
                        key={resource.id} 
                        className="grid grid-cols-12 items-center px-4 py-3 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="col-span-6 flex items-center gap-3">
                          <resource.icon className={`h-5 w-5 ${resource.type === 'pdf' ? 'text-red-500' : resource.type === 'docx' ? 'text-blue-500' : 'text-orange-500'}`} />
                          <span className="font-medium">{resource.name}</span>
                        </div>
                        <div className="col-span-2 text-sm">{resource.course}</div>
                        <div className="col-span-2 text-sm">{resource.size}</div>
                        <div className="col-span-2 text-sm">{resource.date}</div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="documents">
                  <div className="text-center py-8 text-gray-500">
                    <FileType className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>Select a category to view resources</p>
                  </div>
                </TabsContent>

                <TabsContent value="practice">
                  <div className="text-center py-8 text-gray-500">
                    <FileType className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>Select a category to view resources</p>
                  </div>
                </TabsContent>

                <TabsContent value="study-guides">
                  <div className="text-center py-8 text-gray-500">
                    <FileType className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>Select a category to view resources</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Resources;

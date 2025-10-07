import { ReferralGuard } from "@/components/auth/ReferralGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  Upload, 
  Layout, 
  Calculator,
  BookOpen,
  Presentation,
  FileDigit,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ResourcesPage = () => {
  // Sample resource data
  const resources = [
    {
      id: "1",
      title: "CSCI 201 Final Exam Study Guide",
      uploader: "Emma Davis",
      uploadDate: "Oct 15, 2023",
      downloadCount: 156,
      type: "Study Guide",
      course: "CSCI 201"
    },
    {
      id: "2",
      title: "MATH 125 Exam 2 Practice Problems",
      uploader: "James Wilson",
      uploadDate: "Oct 10, 2023",
      downloadCount: 243,
      type: "Practice Exam",
      course: "MATH 125"
    },
    {
      id: "3",
      title: "ECON 203 Lecture Notes",
      uploader: "Sophia Lee",
      uploadDate: "Sep 28, 2023",
      downloadCount: 89,
      type: "Notes",
      course: "ECON 203"
    },
    {
      id: "4",
      title: "PHYS 151 Formula Sheet",
      uploader: "Ryan Chen",
      uploadDate: "Sep 22, 2023",
      downloadCount: 325,
      type: "Summary",
      course: "PHYS 151"
    },
    {
      id: "5",
      title: "WRIT 150 Essay Examples",
      uploader: "Olivia Martinez",
      uploadDate: "Sep 15, 2023",
      downloadCount: 127,
      type: "Notes",
      course: "WRIT 150"
    }
  ];

  // Function to get icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "Notes":
        return <FileText className="h-6 w-6 text-blue-500" />;
      case "Practice Exam":
        return <Calculator className="h-6 w-6 text-green-500" />;
      case "Study Guide":
        return <BookOpen className="h-6 w-6 text-purple-500" />;
      case "Slides":
        return <Presentation className="h-6 w-6 text-yellow-500" />;
      case "Summary":
        return <FileDigit className="h-6 w-6 text-red-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <ReferralGuard minReferrals={2} featureName="Resources">
      <div className="container py-6">
        <div className="mb-4">
          <Button variant="outline" asChild size="sm" className="mb-6">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <h1 className="text-3xl font-bold mb-2">Resources</h1>
          <p className="text-muted-foreground">Access and share study materials for your courses</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-md border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="csci-201">CSCI 201</SelectItem>
                <SelectItem value="math-125">MATH 125</SelectItem>
                <SelectItem value="econ-203">ECON 203</SelectItem>
                <SelectItem value="phys-151">PHYS 151</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
              <Upload className="mr-2 h-4 w-4" /> Upload Resource
            </Button>
          </div>
        </div>

        {/* Resource Types Section */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="bg-gray-100 p-1 rounded-md">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              <Layout className="mr-2 h-4 w-4" /> All Courses
            </TabsTrigger>
            <TabsTrigger value="cs" className="data-[state=active]:bg-white">
              <FileDigit className="mr-2 h-4 w-4" /> Computer Science
            </TabsTrigger>
            <TabsTrigger value="math" className="data-[state=active]:bg-white">
              <Calculator className="mr-2 h-4 w-4" /> Mathematics
            </TabsTrigger>
            <TabsTrigger value="business" className="data-[state=active]:bg-white">
              <FileText className="mr-2 h-4 w-4" /> Business
            </TabsTrigger>
            <TabsTrigger value="writing" className="data-[state=active]:bg-white">
              <BookOpen className="mr-2 h-4 w-4" /> Writing & Humanities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {/* Resource Type Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white border rounded-md p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <span className="font-medium">Notes</span>
              </div>
              <div className="bg-white border rounded-md p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <Calculator className="h-6 w-6 text-green-500" />
                </div>
                <span className="font-medium">Practice Exam</span>
              </div>
              <div className="bg-white border rounded-md p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-purple-100 p-3 rounded-full mb-3">
                  <BookOpen className="h-6 w-6 text-purple-500" />
                </div>
                <span className="font-medium">Study Guide</span>
              </div>
              <div className="bg-white border rounded-md p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-yellow-100 p-3 rounded-full mb-3">
                  <Presentation className="h-6 w-6 text-yellow-500" />
                </div>
                <span className="font-medium">Slides</span>
              </div>
              <div className="bg-white border rounded-md p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-red-100 p-3 rounded-full mb-3">
                  <FileDigit className="h-6 w-6 text-red-500" />
                </div>
                <span className="font-medium">Summary</span>
              </div>
            </div>

            {/* Resources List */}
            <div className="bg-white border rounded-md overflow-hidden">
              <h2 className="font-semibold text-xl p-6 border-b">All Resources</h2>
              <div className="divide-y">
                {resources.map((resource) => (
                  <div key={resource.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start">
                      <div className="mr-4">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                          <h3 className="font-medium text-lg">{resource.title}</h3>
                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <Badge variant="outline" className="bg-gray-100">{resource.course}</Badge>
                            <Badge variant="outline" className={
                              resource.type === "Study Guide" ? "bg-purple-100 text-purple-800" :
                              resource.type === "Practice Exam" ? "bg-green-100 text-green-800" :
                              resource.type === "Notes" ? "bg-blue-100 text-blue-800" :
                              resource.type === "Slides" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }>{resource.type}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Uploaded by {resource.uploader} • {resource.uploadDate}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{resource.downloadCount} downloads</span>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Other tabs content would go here */}
          <TabsContent value="cs" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Computer Science resources will appear here.</p>
            </div>
          </TabsContent>
          <TabsContent value="math" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Mathematics resources will appear here.</p>
            </div>
          </TabsContent>
          <TabsContent value="business" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Business resources will appear here.</p>
            </div>
          </TabsContent>
          <TabsContent value="writing" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Writing & Humanities resources will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ReferralGuard>
  );
};

export default ResourcesPage;

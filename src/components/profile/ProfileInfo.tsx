
interface ProfileInfoProps {
  firstName: string;
  lastName: string;
  userEmail?: string;
  userRole?: string;
  profile?: any;
}

export const ProfileInfo = ({ 
  firstName, 
  lastName, 
  userEmail, 
  userRole, 
  profile 
}: ProfileInfoProps) => {
  return (
    <>
      <h2 className="text-xl font-semibold mt-4">
        {firstName && lastName ? `${firstName} ${lastName}` : userEmail}
      </h2>
      <p className="text-muted-foreground">{userRole || "Student"}</p>
      
      <div className="w-full mt-6">
        <div className="p-3 border rounded-md mb-3">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{userEmail}</p>
        </div>
        
        {userRole === "tutor" && profile && (
          <>
            <div className="p-3 border rounded-md mb-3">
              <p className="text-sm text-muted-foreground">Rating</p>
              <p className="font-medium">{profile?.average_rating?.toFixed(1) || "N/A"}/5.0</p>
            </div>
            <div className="p-3 border rounded-md">
              <p className="text-sm text-muted-foreground">Hourly Rate</p>
              <p className="font-medium">${profile?.hourly_rate || "25"}/hour</p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

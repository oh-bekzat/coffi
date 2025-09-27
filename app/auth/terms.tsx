import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import NavigationHeader from "../../components/NavigationHeader";
import Terms from "../../components/bottomsheets/Terms";

const TermsPage = () => {
  return (
    <SafeAreaView className="bg-mono_900 flex-1">
      <NavigationHeader 
        showBack={true} 
        onBack={() => router.back()} 
        showClose={false} 
      />
      <Terms />
    </SafeAreaView>
  );
};

export default TermsPage;
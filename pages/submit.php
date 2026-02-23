<?php

$messageFile = "../data.txt";

$file = fopen($messageFile, "r");

if ($file) {
	$existingData = fread($file, 100000);
	fclose($file);
}
else $existingData = "";


$existingData .= "{\n\tfullName: \"". $_POST["fullName"] . "\", \n\temail: \"" . $_POST["email"] . "\", \n\tphone: \"" . $_POST["phone"] . "\", \n\tsubject: \"" . $_POST["subject"] . "\", \n\tmessage: \"" . $_POST["message"] . "\"\n},\n";

$file = fopen($messageFile, "w");

fwrite($file, $existingData);

fclose($file);
?>

<script>
alert("Thanks for leaving your message, we will get back to you soon!");
window.location.replace("http://64.226.84.191/index.html");
</script>

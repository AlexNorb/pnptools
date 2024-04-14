<?php

// Get the selected option and comments from the POST data
$selectedOption = $_POST['option'];
$comments = $_POST['comments'];

// Read the current counts for each option from a text file
$dataFile = "data.txt";
if (file_exists($dataFile)) {
    $data = file_get_contents($dataFile);
    $counts = explode("\n", $data);
} else {
    $counts = array_fill(0, 5, 0);
}

// Increment the count for the selected option
$counts[$selectedOption - 1]++;

// Write the updated counts back to the text file
file_put_contents($dataFile, implode("\n", $counts));

// Append the comments to the text file
file_put_contents($dataFile, "\n" . $comments . "\n", FILE_APPEND);

// Return a response to the user
echo "Thank you for submitting the survey!";

?>


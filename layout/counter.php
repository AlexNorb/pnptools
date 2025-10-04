<?php
// Set the path to the counter file
$counter_file = 'counter.txt';

// Check if the counter file exists
if (file_exists($counter_file)) {
  // Read the current value of the counter
  $counter = (int)file_get_contents($counter_file);
} else {
  // Initialize the counter to 0 if the file does not exist
  $counter = 0;
}

// Increment the counter
$counter++;

// Write the new value of the counter to the file
file_put_contents($counter_file, $counter);

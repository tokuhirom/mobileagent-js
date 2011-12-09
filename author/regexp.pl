#!/usr/bin/perl
use strict;
use warnings;
use utf8;
use 5.010000;

my $DoCoMoRE = '^DoCoMo/\d\.\d[ /]';
my $JPhoneRE = '^(?i:J-PHONE/\d\.\d)';                                                         my $VodafoneRE = '^Vodafone/\d\.\d';
my $VodafoneMotRE = '^MOT-';
my $SoftBankRE = '^SoftBank/\d\.\d';
my $SoftBankCrawlerRE = '^Nokia[^/]+/\d\.\d';                                                  my $EZwebRE  = '^(?:KDDI-[A-Z]+\d+[A-Z]? )?UP\.Browser\/';
my $AirHRE = '^Mozilla/3\.0\((?:WILLCOM|DDIPOCKET)\;';

my $ret = "(?:($DoCoMoRE)|($JPhoneRE|$VodafoneRE|$VodafoneMotRE|$SoftBankRE|$SoftBankCrawlerRE)|($EZwebRE)|($AirHRE))\n";
$ret =~ s/\\/\\\\/g;
print $ret;

